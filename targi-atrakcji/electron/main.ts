/**
 * Electron shell for the Remotion stage app (plan: steady-purring-spring.md, Phase 1+2).
 *
 * Hardening scope was trimmed 2026-09-17 after discussion: this is a single-venue, one-day
 * deployment, set up once and run once. Hardening that protects that one 6-7 hour live run does
 * NOT shrink just because the run happens once (a crash, a sleep-induced blackout, or an
 * accidental close is exactly as damaging on run #1 as on run #100, with no do-over) — so those
 * stay. Hardening for repeated/unattended use across changing environments (multi-display
 * auto-detect-and-persist, live window-reassignment shortcuts) is cut: the laptop-to-LED-wall
 * layout is decided once during the day-before setup (see `layout()` below) and not touched again.
 *
 * State lives here, not in the renderer pages: pulpit.tsx and scena.tsx are dumb — they render
 * whatever `payload()` sends over IPC and send actions back. This mirrors the sibling Electron
 * app's src/state.js / main.js split.
 */
import { app, BrowserWindow, Menu, dialog, ipcMain, powerSaveBlocker, screen, type Rectangle } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_STATE, reduce, type Action, type StageState } from '../presenter/bus';
import { createLanServer } from './server';
import { detectHostFirewall } from './firewall';
import { runCheck } from './preflight';
import { KOMPOZYCJE } from '../slides';
import { TALKS } from '../presenter/talks';

const OUT_DIR = path.join(__dirname, '..', 'out', 'pulpit');
// Deliberately not 7777: that's the sibling Electron app's port, and both projects can end up
// checked out side by side on the same dev machine.
const LAN_PORT = 7778;

// CLI: --check (validate + decode-probe every photo/logo/talk file, print, exit) --no-media
// (skip the decode probe, existence only) --smoke [sec] (launch for real, drive it, screenshot,
// quit). Ported from the sibling Electron app's main.js (plan: Phase 5).
const argv = process.argv.slice(1);
const argVal = (flag: string): string | null => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const CHECK_ONLY = argv.includes('--check');
const CHECK_NO_MEDIA = argv.includes('--no-media');
const SMOKE = argv.includes('--smoke') ? Number(argVal('--smoke')) || 4 : 0;

type LanInfo = {
  enabled: boolean;
  key: string | null;
  port: number;
  urls: { iface: string; base: string; key: string }[];
  firewallNotice: string | null;
};

let state: StageState = DEFAULT_STATE;
let lanInfo: LanInfo = { enabled: false, key: null, port: LAN_PORT, urls: [], firewallNotice: null };
let controlWin: BrowserWindow | null = null;
let stageWin: BrowserWindow | null = null;
let lan: ReturnType<typeof createLanServer> | null = null;

function payload() {
  return { state, lan: lanInfo };
}

// Single source of truth (plan, Phase 2): IPC to local windows and the LAN WebSocket are both
// just delivery channels fed from here — neither owns state. Forgetting the `lan.broadcast` half
// of this was a real bug caught by ws-action-check.js: actions arriving over LAN reached the
// reducer and updated `state`, but nothing pushed the result back out to LAN clients, so a
// phone's own action would silently never update its own screen.
function broadcast() {
  const p = payload();
  for (const w of [controlWin, stageWin]) {
    if (w && !w.isDestroyed()) w.webContents.send('state', p);
  }
  if (lan) lan.broadcast(p);
}

function dispatch(action: Action) {
  state = reduce(state, action);
  broadcast();
}

/**
 * Fixed, one-time layout: two displays -> control on the first, stage on the second (the venue
 * setup: operator's laptop screen + the LED wall feed). One display (dev machine) -> tiled side
 * by side so both windows are usable while working on this locally. No persistence, no live
 * reassignment shortcuts — see the file header for why that was cut.
 */
function layout(): { control: Rectangle; stage: Rectangle } {
  const displays = screen.getAllDisplays();
  if (displays.length >= 2) {
    return { control: displays[0].bounds, stage: displays[1].bounds };
  }
  const d = displays[0].bounds;
  const w = Math.floor(d.width / 2);
  return {
    control: { x: d.x, y: d.y, width: w, height: d.height },
    stage: { x: d.x + w, y: d.y, width: d.width - w, height: d.height },
  };
}

function createRoleWindow(role: 'control' | 'stage', bounds: Rectangle): BrowserWindow {
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    skipTaskbar: role === 'stage',
    title: `Targi Atrakcji — ${role.toUpperCase()}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  // vite build names output files after the source html's basename, not the rollup input key —
  // presenter/index.html (the pulpit) builds to out/pulpit/index.html.
  const file = role === 'control' ? 'index.html' : 'scena.html';
  win.loadFile(path.join(OUT_DIR, file));
  win.once('ready-to-show', () => {
    win.setBounds(bounds);
    win.show();
    win.webContents.send('state', payload());
  });

  // Same recovery as the sibling app's main.js: reload in place, don't destroy/recreate the
  // window, so `windows.*` references and bounds stay valid.
  win.webContents.on('render-process-gone', (_e, details) => {
    console.log(`[crash] ${role} renderer gone (${details.reason}) — reloading`);
    setTimeout(() => {
      if (!win.isDestroyed()) win.reload();
    }, 300);
  });
  win.webContents.on('unresponsive', () => console.log(`[warn] ${role} renderer unresponsive`));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  return win;
}

async function confirmQuit() {
  const options = {
    type: 'warning' as const,
    buttons: ['Anuluj', 'Zamknij'],
    defaultId: 0,
    cancelId: 0,
    title: 'Zamknąć aplikację?',
    message: 'Zamknąć aplikację prezentacji? Ekran sceny zgaśnie.',
  };
  const parent = controlWin && !controlWin.isDestroyed() ? controlWin : null;
  const { response } = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options);
  if (response === 1) app.quit();
}

if (CHECK_ONLY) {
  // Must work while a real show is being edited/rehearsed the day before, so it never takes the
  // single-instance lock and never opens a visible window.
  runCheck(LAN_PORT, CHECK_NO_MEDIA).catch((e) => { console.error(`check failed: ${e.stack || e}`); process.exit(2); });
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (controlWin && !controlWin.isDestroyed()) controlWin.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // no Ctrl+W / Ctrl+R / F11 / DevTools accelerators
    powerSaveBlocker.start('prevent-display-sleep');

    const bounds = layout();
    controlWin = createRoleWindow('control', bounds.control);
    stageWin = createRoleWindow('stage', bounds.stage);

    ipcMain.on('request-state', (e) => e.sender.send('state', payload()));
    ipcMain.on('action', (_e, action: Action) => dispatch(action));
    ipcMain.on('quit-request', () => {
      confirmQuit().catch((e) => console.error('[quit] dialog failed', e));
    });

    // LAN bridge: presenter Notes on a phone, and Control/Stage on a second device if needed.
    // Never blocks or fails the local show — a WiFi problem at the venue must never take the
    // Electron windows down with it, so failures here are logged, not thrown.
    const fw = detectHostFirewall(LAN_PORT);
    const firewallNotice = fw.name
      ? `Drugie urządzenie: ${fw.name} ${fw.certain ? 'jest włączony na tej maszynie' : 'zwykle jest włączony domyślnie'} i zablokuje port ${LAN_PORT}, chyba że go odblokujesz. Komenda: ${fw.hint}`
      : null;
    if (firewallNotice) console.log(`[preflight] ${firewallNotice}`);

    lan = createLanServer({
      outDir: OUT_DIR,
      port: LAN_PORT,
      getPayload: payload,
      onAction: (action: object) => dispatch(action as Action),
      log: (...a: unknown[]) => console.log(...a),
    });
    lan.listen()
      .then(() => {
        lanInfo = { enabled: true, key: lan!.key, port: lan!.port, urls: lan!.urls(), firewallNotice };
        broadcast();
      })
      .catch((e: Error) => console.error('[lan] failed to start:', e.message));

    if (SMOKE) runSmoke();
  });

  app.on('window-all-closed', () => app.quit());

  // --smoke: unattended self-test. Drives the reducer through blocks/slides/blank/loop and (if a
  // demo talk is registered) a real video crossfade, screenshots both windows, exits 0/1. Lighter
  // than the sibling app's version: no live frame-drop telemetry (scena.tsx doesn't report
  // playback quality back to main — the --check decode probe above is the authoritative
  // "does this file play here" answer; this is just "did the app stay up and render").
  async function runSmoke() {
    const errors: string[] = [];
    const hook = (role: string, win: BrowserWindow | null) => win?.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) errors.push(`${role}: ${msg}`); });
    hook('control', controlWin);
    hook('stage', stageWin);
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await wait(2500);

    const steps: Action[] = [
      { type: 'showBlock', id: KOMPOZYCJE[0].id },
      { type: 'move', delta: 1 },
      { type: 'move', delta: 1 },
      { type: 'toggleBlank' },
      { type: 'toggleBlank' },
      { type: 'toggleLoop' },
      { type: 'toggleLoop' },
    ];
    const talk = TALKS.find((t) => t.video || t.audio);
    if (talk) steps.push({ type: 'showTalk', slideId: talk.slideId });
    for (const a of steps) { dispatch(a); await wait(400); }
    if (talk) { await wait(1500); dispatch({ type: 'endTalk' }); await wait(400); }

    const outDir = process.env.SMOKE_OUT || path.join(__dirname, '..');
    for (const [role, win] of [['control', controlWin], ['stage', stageWin]] as const) {
      try { const img = await win!.webContents.capturePage(); fs.writeFileSync(path.join(outDir, `smoke-${role}.png`), img.toPNG()); } catch (e) { errors.push(`${role}: capture failed ${(e as Error).message}`); }
    }
    const alive = [controlWin, stageWin].every((w) => w && !w.isDestroyed());
    console.log(`[smoke] alive=${alive} source=${JSON.stringify(state.source)} blank=${state.blank} loop=${state.loop} talkTested=${!!talk} errors=${errors.length}`);
    if (!talk) console.log('[smoke] no registered talk with video/audio in presenter/talks.ts — this run proves NOTHING about the presenter-video crossfade');
    console.log(`[smoke] lan: ${lan ? `enabled, ${lan.urls().length} address(es)` : 'disabled'}`);
    errors.forEach((e) => console.log(`[smoke] renderer error: ${e}`));
    await wait(Math.max(0, SMOKE * 1000 - 5000));
    app.exit(alive && errors.length === 0 ? 0 : 1);
  }
}

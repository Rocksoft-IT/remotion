/**
 * `--check` / `--smoke`, ported from the sibling Electron app's main.js (plan: Phase 5, "keep,
 * not cut" — this is the one-time, night-before verification that "set up and ready" really
 * means "will decode on THIS machine", which is the whole point of setting up a day early).
 *
 * Existence is not playability. mediaToProbe() walks slides.ts/talks.ts for every file a real
 * show run would decode; probeMedia() loads each one in a hidden window and reports what
 * actually came out, the same way renderer/probe.html (copied here verbatim) already does for
 * the current app.
 */
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { deck, type Slide } from '../slides';
import { TALKS } from '../presenter/talks';
import { AGENDA } from '../presenter/agenda';
import { detectHostFirewall } from './firewall';

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MB = 1024 * 1024;
const BIG_FILE_BYTES = 20 * MB; // above this a slide/talk change visibly stutters while it decodes
const WALL_MIN_WIDTH = 1280; // below this a full-bleed image is upscaled on any modern wall

const isTodo = (v?: string): boolean => typeof v === 'string' && v.trim().startsWith('TODO:');
const clean = (v?: string): string | undefined => (!v || isTodo(v) ? undefined : v);

type ProbeItem = { kind: 'video' | 'audio' | 'image'; relPath: string; path: string; url: string; where: string; uses: number; fullBleed?: boolean };

/** Every decodable file a real run would touch: speaker photos, partner logos, branding, and
 *  registered talk video/audio — for the decode probe. One entry per distinct file. */
export function mediaToProbe(): ProbeItem[] {
  const out: ProbeItem[] = [];
  const add = (kind: ProbeItem['kind'], relPath: string | undefined, where: string, opts: { fullBleed?: boolean } = {}) => {
    const rel = clean(relPath);
    if (!rel) return;
    const dup = out.find((o) => o.relPath === rel);
    if (dup) { dup.uses += 1; return; }
    const abs = path.join(PUBLIC_DIR, rel);
    if (!fs.existsSync(abs)) return; // reported separately, in printCheckSummary — decoding a file that isn't there tells us nothing new
    out.push({ kind, relPath: rel, path: abs, url: pathToFileURL(abs).href, where, uses: 1, ...opts });
  };

  deck.forEach((s: Slide, i: number) => {
    const where = `slide ${i + 1} (${s.id})`;
    if (s.kind === 'prelegent') add('image', s.photo, where, { fullBleed: false });
    if (s.kind === 'partnerzy') s.items.forEach((it) => add('image', it.logo, where, { fullBleed: false }));
  });
  // Branding is on screen for the whole event; matches src/assets.ts's LOGO paths.
  add('image', 'logo/logo-biale.png', 'branding (jasne tło)');
  add('image', 'logo/logo-granat.png', 'branding (ciemne tło)');
  add('image', 'logo/znak-primary.png', 'branding (znak)');
  TALKS.forEach((t) => {
    add('video', t.video, `wystąpienie ${t.slideId}`, { fullBleed: true });
    add('audio', t.audio, `wystąpienie ${t.slideId}`);
  });
  return out;
}

/** Missing-but-referenced files: a photo/logo/video path set on a slide that isn't on disk.
 *  Not fatal by itself (everything here has a text/branded fallback), but worth surfacing loudly
 *  rather than discovering it live when the fallback shows up on the wall. */
function missingMedia(): string[] {
  const problems: string[] = [];
  const check = (relPath: string | undefined, where: string) => {
    const rel = clean(relPath);
    if (!rel) return;
    if (!fs.existsSync(path.join(PUBLIC_DIR, rel))) problems.push(`${where}: ${rel} is referenced but not in public/`);
  };
  deck.forEach((s, i) => {
    const where = `slide ${i + 1} (${s.id})`;
    if (s.kind === 'prelegent') check(s.photo, where);
    if (s.kind === 'partnerzy') s.items.forEach((it) => check(it.logo, where));
  });
  TALKS.forEach((t) => { check(t.video, `wystąpienie ${t.slideId}`); check(t.audio, `wystąpienie ${t.slideId}`); });
  return problems;
}

function firewallNotice(lanPort: number): string | null {
  const fw = detectHostFirewall(lanPort);
  if (!fw.name) return null;
  return `Drugie urządzenie: ${fw.name} ${fw.certain ? 'jest włączony na tej maszynie' : 'zwykle jest włączony domyślnie'} i zablokuje port ${lanPort}, chyba że go odblokujesz. Komenda: ${fw.hint}`;
}

function printCheckSummary(lanPort: number): void {
  console.log(`Targi Atrakcji — ${deck.length} slajdów`);
  const talksLive = TALKS.filter((t) => t.video || t.audio).length;
  console.log(`  ${talksLive} zarejestrowane wystąpienie(a) z realnym video/audio`);
  deck.forEach((s, i) => {
    const bits: string[] = [`[${s.kind}]`, s.id];
    if (s.kind === 'prelegent') bits.push(s.talkTitle, `(${s.name})`);
    if (s.kind === 'panel') bits.push(s.title, `(mod. ${s.moderator})`);
    console.log(`  ${String(i + 1).padStart(3)}. ${bits.join(' ')}`);
  });
  if (AGENDA.length) {
    console.log(`\n  program dnia — ${AGENDA.length} punkt(ów):`);
    AGENDA.forEach((a) => console.log(`  ${a.time.padEnd(8)} [${a.kind}] ${a.title}${a.presenter ? '  — ' + a.presenter : ''}`));
  } else {
    console.log('\n  brak wpisów z godziną w slides.ts — widok Notatek nie pokaże programu dnia');
  }
  const fw = firewallNotice(lanPort);
  if (fw) console.log(`\n  ${fw}`);

  // Missing branding isn't a problem (Logo/Mark draw a text signature until these arrive — see
  // public/logo/README.txt), but it's worth saying out loud each time --check runs, not just
  // once when the folder was created.
  const BRAND = ['logo/logo-biale.png', 'logo/logo-granat.png', 'logo/znak-primary.png'];
  const missingBrand = BRAND.filter((rel) => !fs.existsSync(path.join(PUBLIC_DIR, rel)));
  if (missingBrand.length) {
    console.log(`\n  branding: ${missingBrand.join(', ')} brak w public/logo/ — slajdy rysują zastępczą sygnaturę tekstową (public/logo/README.txt)`);
  }
}

function finishCheck(problems: string[]): void {
  // app.exit, not process.exit: process.exit() after app.whenReady() doesn't stop the current
  // tick, which used to print "OK" underneath a failure in the sibling app.
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.log('  - ' + p));
    app.exit(1);
    return;
  }
  console.log('\nOK — brak problemów.');
  app.exit(0);
}

const MEDIA_ERR: Record<number, string> = {
  1: 'MEDIA_ERR_ABORTED',
  2: 'MEDIA_ERR_NETWORK (plik nieczytelny)',
  3: 'MEDIA_ERR_DECODE (plik uszkodzony lub kodek nieobsługiwany na tej maszynie)',
  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED (kontener/kodek nieobsługiwany — przekoduj do mp4 H.264/AAC)',
};

type ProbeResult =
  | { ok: true; duration?: number; width?: number; height?: number; frames?: number; dropped?: number; firstFrameMs?: number | null; probeMs: number }
  | { ok: false; code: number | null; error: string };

async function probeMedia(items: ProbeItem[]): Promise<ProbeResult[]> {
  const win = new BrowserWindow({ show: false, width: 320, height: 180, webPreferences: { sandbox: true, contextIsolation: true, autoplayPolicy: 'no-user-gesture-required', backgroundThrottling: false } });
  await win.loadFile(path.join(__dirname, 'probe.html'));
  const results = await win.webContents.executeJavaScript(`window.probeAll(${JSON.stringify(items.map(({ kind, url }) => ({ kind, url })))})`);
  win.destroy();
  return results;
}

export async function runCheck(lanPort: number, noMedia: boolean): Promise<void> {
  printCheckSummary(lanPort);
  const problems: string[] = [...missingMedia()];
  const items = mediaToProbe();
  if (noMedia || !items.length) {
    console.log(items.length ? '\n  media: pominięto próbę odtworzenia (--no-media)' : '\n  media: nic do sprawdzenia (brak zdjęć/wideo)');
    return finishCheck(problems);
  }
  const kinds = (['video', 'audio', 'image'] as const)
    .map((k) => [items.filter((i) => i.kind === k).length, k] as const)
    .filter(([n]) => n)
    .map(([n, k]) => `${n} ${k}`)
    .join(', ');
  console.log(`\n  media — dekodowanie ${items.length} plik(ów) na tej maszynie (${kinds}):`);
  await app.whenReady();
  let results: ProbeResult[];
  try {
    results = await probeMedia(items);
  } catch (e) {
    problems.push(`próba dekodowania nie uruchomiła się: ${(e as Error).message}`);
    return finishCheck(problems);
  }
  results.forEach((r, i) => {
    const it = items[i];
    if (r.ok) {
      let detail: string;
      const notes: string[] = [];
      if (it.kind === 'image') {
        const bytes = (() => { try { return fs.statSync(it.path).size; } catch { return null; } })();
        detail = `${r.width}x${r.height}`;
        if (bytes != null) detail += `  ${(bytes / MB).toFixed(bytes < MB ? 2 : 1)} MB`;
        if (bytes != null && bytes > BIG_FILE_BYTES) problems.push(`${it.where}: ${it.relPath} ma ${(bytes / MB).toFixed(1)} MB — dość dużo, by zaciąć zmianę slajdu; zmniejsz plik`);
        if (it.fullBleed && (r.width ?? 0) < WALL_MIN_WIDTH) notes.push(`<-- tylko ${r.width}px szerokości: rozciągnięte i miękkie na ścianie 1080p+`);
      } else {
        const dur = Number.isFinite(r.duration) ? `${Math.floor((r.duration as number) / 60)}:${String(Math.round((r.duration as number) % 60)).padStart(2, '0')}` : '?:??';
        const dims = it.kind === 'video' ? `${r.width}x${r.height}  ` : '';
        const decoded = it.kind === 'video' ? `${r.frames} klatek w ${r.probeMs} ms` : `dźwięk działa po ${r.probeMs} ms`;
        detail = `${dims}${dur}  ${decoded}`;
        if (r.firstFrameMs != null && r.firstFrameMs > 1500) notes.push(`<-- ${r.firstFrameMs} ms do pierwszej klatki: wolny start na scenie`);
        if (it.kind === 'video' && !r.frames) problems.push(`${it.where}: ${it.relPath} wczytał się, ale zdekodował 0 klatek w ${r.probeMs} ms — na scenie pokaże czarny ekran`);
        if (r.dropped) problems.push(`${it.where}: ${it.relPath} zgubił ${r.dropped} z ${r.frames} klatek w pierwszej sekundzie — ta maszyna sobie z nim nie radzi`);
        const bytes = (() => { try { return fs.statSync(it.path).size; } catch { return null; } })();
        if (bytes != null && bytes > BIG_FILE_BYTES) problems.push(`${it.where}: ${it.relPath} ma ${(bytes / MB).toFixed(1)} MB — dość dużo, by zaciąć start; rozważ mniejszy bitrate`);
      }
      console.log(`    OK    ${it.where.padEnd(28)} ${it.relPath}  ${detail}${it.uses > 1 ? `  (użyty ${it.uses}x)` : ''}`);
      notes.forEach((n) => console.log(`          ${' '.repeat(28)} ${n}`));
    } else {
      const why = r.code ? MEDIA_ERR[r.code] || `kod błędu ${r.code}` : r.error;
      console.log(`    FAIL  ${it.where.padEnd(28)} ${it.relPath}  ${why}`);
      problems.push(`${it.where}: ${it.relPath} nie odtwarza się na tej maszynie: ${why}`);
    }
  });
  finishCheck(problems);
}

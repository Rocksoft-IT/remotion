'use strict';
// LAN bridge, ported from the sibling Electron app's src/server.js (plan: steady-purring-spring.md,
// Phase 3). Same design rule: this is a *transport*, nothing else — it never owns show state, only
// forwards main.ts's payload() and hands incoming actions back to main.ts's dispatch().
//
// Genuinely simpler than the original here, not just trimmed: the original's lanPayload/
// lanContentUrl (~30 lines) exist because deck.json content is referenced by absolute file://
// path, meaningless to a LAN browser. This app's content is Vite-bundled and Remotion assets
// resolve through staticFile() to root-relative URLs already (confirmed empirically, Day-0 check
// #2 in the plan) — so the payload needs no rewriting at all, and everything the build produced
// (HTML, JS bundles, public/ assets) lives in one directory servable as-is.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const ws = require('./ws');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime', '.ogv': 'video/ogg', '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8',
};
const mimeFor = (p) => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';

// Output basenames from `vite build` (electron/main.ts loads the same files locally via loadFile).
const ROLE_PAGES = { control: 'index.html', notes: 'notes.html', stage: 'scena.html' };

function newKey() {
  return crypto.randomBytes(4).toString('hex');
}

/** Addresses an operator can actually type into a second device. */
function lanAddresses() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.internal) continue;
      if (a.family !== 'IPv4' && a.family !== 4) continue;
      out.push({ iface: name, address: a.address });
    }
  }
  return out;
}

/**
 * All three pages carry the same `connect-src 'none'` baseline locally (they talk to Electron
 * main over IPC, never the network) and need it relaxed only on the copy served over LAN — same
 * mechanism as the sibling app's relaxStageCsp, generalized to any of our three pages rather than
 * just Stage, since here all three share the same posture.
 *
 * This rewrites inside the <meta> tag's content attribute specifically, not the whole file: a
 * plain string replace previously bit this exact project by rewriting a comment that happened to
 * contain the same text before the real meta tag did (see the sibling app's server.js for the
 * full story). Keep the scoped regex.
 */
const CSP_META = /(<meta\b[^>]*?http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*?content\s*=\s*")([^"]*)(")/i;

function relaxCsp(html) {
  return html.replace(CSP_META, (_m, pre, policy, post) =>
    pre + policy.replace(/connect-src\s+'none'/i, 'connect-src ws: wss:') + post);
}

function cspIsOpen(html) {
  const m = CSP_META.exec(html);
  return !!m && !/connect-src\s+'none'/i.test(m[2]);
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/**
 * @param {object} opts
 * @param {string} opts.outDir           `vite build` output directory (HTML + assets + public/)
 * @param {number} opts.port
 * @param {string} [opts.host]           default '0.0.0.0'
 * @param {string} [opts.key]            access key; generated if absent
 * @param {boolean} [opts.allowControl]  false = LAN clients cannot send actions (notes-only)
 * @param {() => object} opts.getPayload the same payload() main.ts broadcasts over IPC
 * @param {(action:object, info:object) => void} opts.onAction
 * @param {(...a:any[]) => void} [opts.log]
 */
function createLanServer(opts) {
  const { outDir, port, host = '0.0.0.0', allowControl = true, getPayload, onAction, log = () => {} } = opts;
  const key = opts.key || newKey();
  let boundPort = port;
  const clients = new Set();

  const authed = (req, url) => url.searchParams.get('k') === key || parseCookies(req.headers.cookie).lpm_key === key;

  function send(res, code, body, type = 'text/plain; charset=utf-8') {
    const b = Buffer.from(body, 'utf8');
    res.writeHead(code, { 'content-type': type, 'content-length': b.length, 'cache-control': 'no-store' });
    res.end(b);
  }

  function sendFile(req, res, abs, { transform = null } = {}) {
    let st;
    try { st = fs.statSync(abs); } catch { return send(res, 404, 'Not found'); }
    if (!st.isFile()) return send(res, 404, 'Not found');
    const type = mimeFor(abs);
    if (transform) {
      const body = Buffer.from(transform(fs.readFileSync(abs, 'utf8')), 'utf8');
      res.writeHead(200, { 'content-type': type, 'content-length': body.length, 'cache-control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      let start = range[1] === '' ? null : Number(range[1]);
      let end = range[2] === '' ? null : Number(range[2]);
      if (start === null) { start = Math.max(0, st.size - (end || 0)); end = st.size - 1; }
      if (end === null || end >= st.size) end = st.size - 1;
      if (!(start >= 0) || start > end) {
        res.writeHead(416, { 'content-range': `bytes */${st.size}` });
        return res.end();
      }
      res.writeHead(206, {
        'content-type': type, 'content-length': end - start + 1,
        'content-range': `bytes ${start}-${end}/${st.size}`, 'accept-ranges': 'bytes', 'cache-control': 'no-store',
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(abs, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs).pipe(res);
  }

  /** Resolve a URL path inside a directory, refusing anything that escapes it. */
  function within(dir, relPath) {
    const decoded = relPath.split('/').filter(Boolean).map(decodeURIComponent);
    if (decoded.some((s) => s === '..' || s.includes('\0'))) return null;
    const abs = path.resolve(dir, ...decoded);
    const root = path.resolve(dir) + path.sep;
    return abs === path.resolve(dir) || abs.startsWith(root) ? abs : null;
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const p = url.pathname;

    if (p === '/') return send(res, 200, indexPage(key), 'text/html; charset=utf-8');

    const role = p.replace(/^\/+|\/+$/g, '');
    if (ROLE_PAGES[role]) {
      if (!authed(req, url)) {
        const given = url.searchParams.get('k');
        return send(res, 403, keyPage(role, given, boundPort), 'text/html; charset=utf-8');
      }
      res.setHeader('set-cookie', `lpm_key=${encodeURIComponent(key)}; Path=/; SameSite=Lax; Max-Age=86400`);
      log(`[lan] serving ${role} to ${req.socket.remoteAddress}`);
      return sendFile(req, res, path.join(outDir, ROLE_PAGES[role]), {
        transform: (html) => {
          const out = relaxCsp(html);
          if (!cspIsOpen(out)) log(`[lan] ERROR: could not relax the ${role} page CSP — a LAN client will sit on "connecting…" forever.`);
          return out;
        },
      });
    }

    if (!authed(req, url)) return send(res, 403, 'Access key required');

    // Everything else (JS bundles under /assets/, and public/ assets like /foto/*, /logo/*,
    // /video/*) lives directly under outDir — no separate content route needed.
    const abs = within(outDir, p);
    return abs ? sendFile(req, res, abs) : send(res, 403, 'Forbidden');
  });

  server.on('upgrade', (req, socket) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const wsKey = req.headers['sec-websocket-key'];
    if (url.pathname !== '/ws' || !wsKey || !authed(req, url)) {
      socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
      return;
    }
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${ws.acceptKey(wsKey)}\r\n\r\n`
    );
    socket.setNoDelay(true);

    const client = {
      socket,
      role: url.searchParams.get('role') || 'unknown',
      address: socket.remoteAddress,
      reader: new ws.FrameReader(256 * 1024),
    };
    clients.add(client);
    log(`[lan] ${client.role} connected from ${client.address} (${clients.size} client(s))`);

    const drop = (why) => {
      if (!clients.has(client)) return;
      clients.delete(client);
      log(`[lan] ${client.role} from ${client.address} disconnected: ${why} (${clients.size} left)`);
      socket.destroy();
    };
    socket.on('error', (e) => drop(e.message));
    socket.on('close', () => drop('closed'));
    socket.on('data', (chunk) => {
      let frames;
      try { frames = client.reader.push(chunk); } catch (e) { return drop(`protocol error: ${e.message}`); }
      for (const f of frames) {
        if (f.op === ws.OP.CLOSE) return drop('client closed');
        if (f.op === ws.OP.PING) { safeWrite(client, ws.pongFrame(f.data)); continue; }
        if (f.op !== ws.OP.TEXT) continue;
        let msg;
        try { msg = JSON.parse(f.data.toString('utf8')); } catch { continue; }
        handle(client, msg);
      }
    });
    sendTo(client, 'state', getPayload());
  });

  function safeWrite(client, buf) {
    try { client.socket.write(buf); } catch (e) { log(`[lan] write failed for ${client.role}: ${e.message}`); }
  }
  function sendTo(client, channel, payload) {
    safeWrite(client, ws.textFrame(JSON.stringify({ channel, payload })));
  }

  function handle(client, msg) {
    if (!msg || typeof msg.channel !== 'string') return;
    if (msg.channel === 'request-state') return sendTo(client, 'state', getPayload());
    if (msg.channel === 'action') {
      if (!allowControl) return log(`[lan] ignored action from ${client.role} — allowControl is false`);
      const action = msg.payload;
      if (!action || typeof action.type !== 'string') return;
      log(`[lan] action "${action.type}" from ${client.role} @ ${client.address}`);
      onAction(action, { role: client.role, address: client.address });
    }
  }

  return {
    key,
    get clientCount() { return clients.size; },
    get port() { return boundPort; },
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          boundPort = server.address().port;
          log(`[lan] listening on ${host}:${boundPort}, key=${key}`);
          for (const { iface, address } of lanAddresses()) log(`[lan]   open http://${address}:${boundPort}/ on the second device and tap a link   (${iface})`);
          resolve();
        });
      });
    },
    /** Forward a state change to every LAN client. Never throws — the show comes first. */
    broadcast(payload) {
      if (!clients.size) return;
      const frame = ws.textFrame(JSON.stringify({ channel: 'state', payload }));
      for (const c of clients) safeWrite(c, frame);
    },
    urls() {
      return lanAddresses().map(({ iface, address }) => ({ iface, base: `http://${address}:${boundPort}`, key }));
    },
    close() {
      for (const c of clients) { try { c.socket.write(ws.closeFrame(1001, 'server shutting down')); c.socket.destroy(); } catch { /* shutting down anyway */ } }
      clients.clear();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

function keyPage(role, given, port) {
  const stale = given != null && given !== '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${stale ? 'Link wygasł' : 'Wymagany klucz dostępu'}</title>
<style>body{font-family:system-ui,sans-serif;background:#092442;color:#ECEFF3;margin:0;padding:24px;line-height:1.55}
h1{font-size:22px;margin:0 0 12px;color:#F3721C}p{margin:.6em 0}code{background:#ffffff1f;padding:2px 6px;border-radius:4px;word-break:break-all}
a.big{display:block;margin:18px 0;padding:14px 16px;background:#F3721C;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;text-align:center;font-size:18px}
small{color:#A8C1F7;display:block;margin-top:18px}</style></head><body>
<h1>${stale ? 'Ten link wygasł' : 'Wymagany klucz dostępu'}</h1>
${stale
  ? `<p>Klucz <code>${escapeHtml(given)}</code> nie jest już aktualny. Nowy klucz generuje się <b>przy każdym uruchomieniu</b> aplikacji.</p>`
  : '<p>Ta strona wymaga klucza dostępu widocznego na ekranie operatora.</p>'}
<p>Nie musisz go przepisywać — otwórz stronę główną i kliknij link, zawsze niesie aktualny klucz:</p>
<a class="big" href="/">Otwórz stronę główną &rarr;</a>
<small>Nadal nic? Aplikacja na laptopie operatora nie działa, albo to urządzenie jest w innej sieci. Port ${port}.</small>
</body></html>`;
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function indexPage(key) {
  const link = (role, title, what) => `<a class="card" href="/${role}?k=${encodeURIComponent(key)}"><b>${title}</b><span>${what}</span></a>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Slajdy sceniczne · Targi Atrakcji</title>
<style>body{font-family:system-ui,sans-serif;background:#092442;color:#ECEFF3;margin:0;padding:20px;line-height:1.5}
h1{font-size:20px;margin:0 0 4px}p.sub{margin:0 0 18px;color:#A8C1F7;font-size:14px}
a.card{display:block;margin:12px 0;padding:16px;background:#0b2b4d;border:1px solid #1c52a466;border-left:5px solid #F3721C;
border-radius:10px;text-decoration:none;color:#fff}
a.card b{display:block;font-size:19px;margin-bottom:3px}a.card span{color:#A8C1F7;font-size:14px}
small{display:block;margin-top:22px;color:#A8C1F7;font-size:13px}</style></head>
<body><h1>Slajdy sceniczne — Targi Atrakcji</h1><p class="sub">Zapisz tę stronę, nie linki poniżej — klucz zmienia się przy restarcie aplikacji.</p>
${link('notes', 'Widok prelegenta', 'notatki, program dnia, co jest następne')}
${link('control', 'Pulpit operatora', 'pełne sterowanie pokazem')}
${link('stage', 'Widok widowni', 'tylko jeśli to urządzenie steruje ścianą LED')}
<small>Klucz dla tej sesji: ${escapeHtml(key)}</small>
</body></html>`;
}

module.exports = { createLanServer, lanAddresses, relaxCsp, cspIsOpen, newKey, mimeFor };

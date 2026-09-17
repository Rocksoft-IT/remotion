import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const root = import.meta.dirname;

/** Bez tego latwo pomylic pulpit ze Studio, ktore stoi na 3001. */
const banner = (): Plugin => ({
  name: 'targi-banner',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      const port = server.config.server.port;
      setTimeout(() => {
        console.log('');
        console.log('  Pulpit operatora:  \x1b[1mhttp://localhost:' + port + '/\x1b[0m');
        console.log('  Okno sceny:        \x1b[1mhttp://localhost:' + port + '/scena.html\x1b[0m  (otwiera sie przyciskiem w pulpicie)');
        console.log('');
        console.log('  \x1b[2mRemotion Studio to osobne narzedzie: npm run studio, port 3001.\x1b[0m');
        console.log('');
      }, 60);
    });
  },
});

/**
 * Pulpit operatora sceny. Dwa okna, jedno zrodlo prawdy:
 *   http://localhost:3000            -> pulpit (sterowanie)
 *   http://localhost:3000/scena.html -> czysty obraz na projektor
 */
export default defineConfig({
  root: path.join(root, 'presenter'),
  publicDir: path.join(root, 'public'),
  // Root-absolute ('/assets/...', Vite's default) breaks under Electron's `loadFile()`: a
  // file:// page has no "site root" to resolve '/assets/...' against, so it resolves to the
  // real OS filesystem root and the bundle 404s silently (no console error, React just never
  // mounts — found by capturing the built Stage page and seeing a blank #root, since the IPC
  // bridge in preload.js works regardless of whether the page's own script ever ran, so the
  // Phase 1-3 checks that only exercised IPC didn't catch this). Relative base resolves
  // correctly under both file:// (Electron, local) and http:// (electron/server.js, LAN).
  base: './',
  server: {
    port: 3000,
    strictPort: true,
    fs: { allow: [root] },
    open: '/',
  },
  plugins: [banner()],
  esbuild: { jsx: 'automatic' },
  build: {
    outDir: path.join(root, 'out', 'pulpit'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        pulpit: path.join(root, 'presenter', 'index.html'),
        scena: path.join(root, 'presenter', 'scena.html'),
        notes: path.join(root, 'presenter', 'notes.html'),
      },
    },
  },
});

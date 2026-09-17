// Entry point Electron actually launches (package.json "main"). Registers tsx's CJS transform
// hook so main.ts can import ../presenter/bus.ts and ../slides.ts directly, TypeScript and all,
// with no separate build step — the same single-source-of-truth slides.ts the renderer bundles
// via Vite is also what drives the reducer in the main process.
require('tsx/cjs');
require('./main.ts');

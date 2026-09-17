import { staticFile } from 'remotion';

/**
 * Remotion serwuje pliki tylko z public/. Skrypt `node scripts/sync-assets.mjs`
 * przenosi tu folder "Logo Targi Atrakcji" i normalizuje nazwy (bez diakrytykow).
 * Dopoki plikow nie ma, komponent Logo rysuje sygnaturę tekstowa i nic sie nie wywala.
 *
 * staticFile() returns a root-absolute URL ("/foo") when Remotion's own bundler hasn't set
 * `window.remotion_staticBase` — true for Remotion Studio / `scripts/render.mjs`, but NOT for the
 * Vite-built presenter app (electron/), which never runs Remotion's bundler at all. Root-absolute
 * resolves to the OS filesystem root under Electron's `loadFile()` (`file://`), the same failure
 * mode `base: './'` was added to vite.config.ts to fix — except staticFile()'s fallback bypasses
 * that fix entirely. Found by probing the built app directly: every photo/logo silently fell back
 * to its text placeholder, indistinguishable from "file not delivered yet" (Portrait/Logo/Mark all
 * treat a failed image load as "missing"), so this had no visible symptom until checked for.
 * `public/` sits flat at the root of both the Vite build output and Remotion's own bundle, so a
 * plain relative path (no leading slash) resolves correctly under both — same convention already
 * used for talk video/audio in presenter/talks.ts.
 */
const isRemotionBundled = typeof window !== 'undefined' && Boolean((window as { remotion_staticBase?: string }).remotion_staticBase);
export const resolveStatic = (relPath: string): string => (isRemotionBundled ? staticFile(relPath) : relPath);

export const LOGO = {
  light: resolveStatic('logo/logo-biale.png'),
  dark: resolveStatic('logo/logo-granat.png'),
  mark: resolveStatic('logo/znak-primary.png'),
};

export const isTodo = (value?: string): boolean =>
  typeof value === 'string' && value.trim().startsWith('TODO:');

export const todoLabel = (value: string) => value.replace(/^TODO:\s*/, '');

/** Zwraca undefined dla pustych i dla placeholderow TODO, zeby nie renderowac smieci. */
export const clean = (value?: string) =>
  !value || isTodo(value) ? undefined : value;

/** Zdjecia prelegentow: public/foto/nazwisko.jpg albo pelny URL. */
export const photoSrc = (value?: string) => {
  const v = clean(value);
  if (!v) return undefined;
  return v.startsWith('http') ? v : resolveStatic(v.replace(/^\/?public\//, ''));
};

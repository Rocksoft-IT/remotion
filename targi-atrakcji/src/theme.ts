import { continueRender, delayRender } from 'remotion';
import { resolveStatic } from './assets';
import { THEME } from '../slides';

/**
 * Inter jest zamiennikiem do czasu decyzji o kroju z identyfikacji (Astrid).
 * latin-ext jest obowiazkowy: bez niego znikaja polskie znaki diakrytyczne.
 * Podmiana kroju = jedna linia tutaj, reszta projektu jej nie zauwazy.
 *
 * Self-hosted (2026-09-17): @remotion/google-fonts/Inter fetched fonts.gstatic.com at runtime,
 * which breaks the zero-internet requirement for the stage machine on show day. Same two files
 * Google's own CSS serves for this exact family/weight-range (variable font, one file per
 * subset covers all weights) fetched once into public/fonts/ and loaded through assets.ts's
 * resolveStatic() — NOT staticFile() directly, which returns a root-absolute URL under the
 * Vite-built presenter app and 404s under Electron's file:// (see assets.ts's comment; caught by
 * probing the built app directly, since the failure mode here is silent — a photo/logo just falls
 * back to its text placeholder, which looks identical to "the real file hasn't arrived yet").
 */
const FONT_FAMILY = 'Inter';
const SUBSETS: { file: string; range: string }[] = [
  {
    file: 'fonts/inter-latin.woff2',
    range:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
  {
    // Carries the Polish diacritics (ą ć ę ł ń ó ś ź ż) — dropping this subset is how they
    // silently disappear while everything else on screen looks fine.
    file: 'fonts/inter-latin-ext.woff2',
    range:
      'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  },
];

const fontHandle = delayRender(`Ładowanie kroju ${FONT_FAMILY} (self-hosted)`);
Promise.all(
  SUBSETS.map(({ file, range }) =>
    new FontFace(FONT_FAMILY, `url(${resolveStatic(file)}) format('woff2')`, {
      weight: '100 900',
      style: 'normal',
      unicodeRange: range,
    })
      .load()
      .then((loaded) => document.fonts.add(loaded)),
  ),
)
  .catch((e) => console.error(`[fonts] ${FONT_FAMILY} self-hosted load failed`, e))
  .finally(() => continueRender(fontHandle));

export const FONT = `${FONT_FAMILY}, system-ui, sans-serif`;

export const C = THEME.colors;
export const SAFE = THEME.safeArea;

export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Tony slajdow. Tlo bazowe jest granatowe, jasne slajdy dokladaja swoja warstwe. */
export const TONE = {
  dark: { bg: C.granat, fg: C.mgla, dim: 'rgba(236,239,243,0.62)', line: 'rgba(236,239,243,0.16)' },
  light: { bg: C.mgla, fg: C.granat, dim: 'rgba(9,36,66,0.60)', line: 'rgba(9,36,66,0.14)' },
  accent: { bg: C.slonce, fg: '#FFFFFF', dim: 'rgba(255,255,255,0.78)', line: 'rgba(255,255,255,0.28)' },
} as const;

export type ToneName = keyof typeof TONE;

/** Minimum czytelnosci z 15 metrow: 32 px w skali 1080p (agenda-slajdy.md, sekcja 1). */
export const MIN_READABLE = 32;

export const base: React.CSSProperties = {
  fontFamily: FONT,
  WebkitFontSmoothing: 'antialiased',
  fontKerning: 'normal',
};

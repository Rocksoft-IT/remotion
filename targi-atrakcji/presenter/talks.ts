/**
 * Registry of real presenter media (Phase 4). Keyed by the slides.ts `prelegent`/`panel` slide id
 * it belongs to, rather than duplicating name/org/title — those already live on that slide.
 * `scripts/import-talk.mjs` prints entries in this shape after pulling video/audio out of a
 * presenter's .pptx; paste them in here by hand (this file is not written automatically — see
 * that script's header for why).
 */
export type Talk = {
  slideId: string;
  video?: string; // public/-relative path, e.g. 'talks/c2-czyz/video.mp4'
  audio?: string;
};

export const TALKS: Talk[] = [
  // Demo entry proving the mechanism end to end (plan: steady-purring-spring.md, Phase 4) — the
  // file is the same placeholder mp4 used in the Phase 0 spike, not Piotr Czyż's real talk.
  // Replace with the real file the same way: scripts/import-talk.mjs extracts it from a pptx,
  // this line points at wherever it lands under public/talks/.
  { slideId: 'c2-czyz', video: 'talks/c2-czyz/video.mp4' },
];

export function talkFor(slideId: string): Talk | null {
  return TALKS.find((t) => t.slideId === slideId) ?? null;
}

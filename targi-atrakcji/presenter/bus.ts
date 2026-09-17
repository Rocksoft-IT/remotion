import { KOMPOZYCJE, deck, type Slide } from '../slides';

/** Co jest teraz na ekranie sceny. */
export type Source =
  | { kind: 'blok'; id: string }
  | { kind: 'slajd'; id: string }
  // Prawdziwa prezentacja prelegenta (Faza 4) — poza timeline'em Remotion, patrz presenter/talks.ts.
  // slideId wskazuje, do ktorej karty tytulowej (prelegent/panel) ta prezentacja nalezy.
  | { kind: 'wystapienie'; slideId: string };

export type StageState = {
  source: Source;
  /** true = pętla bez końca, false = dojedź do końca slajdu i zatrzymaj obraz */
  loop: boolean;
  /** czarny ekran, np. na czas wejścia prelegenta */
  blank: boolean;
  /** rośnie przy każdym poleceniu; wymusza restart odtwarzania nawet dla tego samego źródła */
  seq: number;
};

export const DEFAULT_STATE: StageState = {
  source: { kind: 'blok', id: KOMPOZYCJE[0].id },
  loop: true,
  blank: false,
  seq: 0,
};

/** Kolejnosc dnia: strzalki chodza po tej liscie. */
export const ORDER = deck.map((s) => s.id);

export const step = (currentId: string, delta: number) => {
  const index = ORDER.indexOf(currentId);
  if (index === -1) return ORDER[0];
  const next = Math.min(ORDER.length - 1, Math.max(0, index + delta));
  return ORDER[next];
};

/** Which slide id a source resolves to for "where are we" purposes — a block means its first
 *  slide, a live talk means the chrome slide it's attached to (so agenda/timer lookups still work
 *  correctly while the real presentation is on screen instead of the branded intro card). */
export const currentSlideIdFor = (source: Source): string => {
  if (source.kind === 'slajd') return source.id;
  if (source.kind === 'wystapienie') return source.slideId;
  return KOMPOZYCJE.find((k) => k.id === source.id)?.slides[0]?.id ?? ORDER[0];
};

/**
 * Akcje pulpitu. Stan żyje w procesie main (electron/main.ts) — ten plik dostarcza tylko
 * czyste, beziowe funkcje: main woła `reduce`, pulpit/scena tylko czytają wynik przez IPC.
 * Zero I/O tutaj, tak jak w bliźniaczym src/state.js z aplikacji Electron.
 */
export type Action =
  | { type: 'showSlide'; id: string }
  | { type: 'showBlock'; id: string }
  | { type: 'showTalk'; slideId: string }
  | { type: 'endTalk' }
  | { type: 'move'; delta: number }
  | { type: 'toggleBlank' }
  | { type: 'toggleLoop' }
  | { type: 'replay' };

export const reduce = (state: StageState, action: Action): StageState => {
  switch (action.type) {
    case 'showSlide':
      return { ...state, source: { kind: 'slajd', id: action.id }, loop: false, seq: state.seq + 1 };
    case 'showBlock': {
      const blok = KOMPOZYCJE.find((k) => k.id === action.id);
      return { ...state, source: { kind: 'blok', id: action.id }, loop: blok?.loop ?? true, seq: state.seq + 1 };
    }
    case 'showTalk':
      return { ...state, source: { kind: 'wystapienie', slideId: action.slideId }, loop: false, seq: state.seq + 1 };
    case 'endTalk':
      return state.source.kind === 'wystapienie'
        ? reduce(state, { type: 'showSlide', id: state.source.slideId })
        : state;
    case 'move':
      return reduce(state, { type: 'showSlide', id: step(currentSlideIdFor(state.source), action.delta) });
    case 'toggleBlank':
      return { ...state, blank: !state.blank };
    case 'toggleLoop':
      return { ...state, loop: !state.loop, seq: state.seq + 1 };
    case 'replay':
      return { ...state, seq: state.seq + 1 };
    default:
      return state;
  }
};

/* ------------------------------------------------------------ rozwiazywanie */

export const blockOf = (slideId: string) =>
  KOMPOZYCJE.find((k) => k.slides.some((s) => s.id === slideId));

/** Remotion slides to render for this source — empty for a live talk, which renders as a plain
 *  <video>/<audio> overlay outside Remotion's Sequence timeline (see scena.tsx and the plan's
 *  Phase 0 spike: Remotion's frame-locked model isn't a fit for an arbitrary-duration live talk). */
export const slidesFor = (source: Source): Slide[] => {
  if (source.kind === 'wystapienie') return [];
  if (source.kind === 'blok') {
    const blok = KOMPOZYCJE.find((k) => k.id === source.id);
    return blok ? (blok.slides as Slide[]) : [];
  }
  const slide = deck.find((s) => s.id === source.id);
  return slide ? [slide] : [];
};

export const labelFor = (source: Source): string => {
  if (source.kind === 'wystapienie') return `prezentacja: ${source.slideId}`;
  if (source.kind === 'blok') {
    const blok = KOMPOZYCJE.find((k) => k.id === source.id);
    return blok ? `${blok.id} · ${blok.time}` : source.id;
  }
  return source.id;
};

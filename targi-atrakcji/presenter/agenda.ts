/**
 * Run-of-show derived from slides.ts, for the presenter Notes page (plan: Phase 3).
 *
 * slides.ts has no separate agenda[] the way the sibling Electron app's deck.json does — talk
 * times live inline on the `prelegent`/`panel`/`sekcja` slides that already carry a `time` field.
 * Rather than inventing a second, hand-maintained schedule that could drift from slides.ts (the
 * one file the README calls "the only one to edit day to day"), this derives the agenda from
 * that same data, so there is exactly one source of truth.
 *
 * Deliberately NOT built here: a live per-talk countdown (itemTimer/agendaInfo in the sibling
 * app's src/state.js). Those need a real "a talk is in progress, started at time T, planned for
 * N minutes" concept, which does not exist until Phase 4 adds an actual presenter-content slide
 * (today's `prelegent` slides are branded intro cards with a fixed few-second duration, not a
 * stand-in for the 20-minute talk itself). Building a countdown against that would time the wrong
 * thing. This module only answers "what's now / what's next", which is well-defined today.
 */
import { deck, KOMPOZYCJE, type Slide } from '../slides';

export type AgendaItem = {
  slideId: string;
  time: string;
  minutes: number;
  title: string;
  presenter?: string;
  kind: Slide['kind'];
};

function parseClock(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

function titleOf(s: Slide): string {
  if (s.kind === 'prelegent') return s.talkTitle;
  if (s.kind === 'panel') return s.title;
  if (s.kind === 'sekcja') return s.title;
  return '';
}

function presenterOf(s: Slide): string | undefined {
  if (s.kind === 'prelegent') return [s.name, s.org].filter(Boolean).join(' · ');
  if (s.kind === 'panel') return `Moderacja: ${s.moderator}`;
  return undefined;
}

function hasTime(s: Slide): s is Slide & { time: string } {
  return typeof (s as { time?: unknown }).time === 'string' && (s as { time: string }).time.length > 0;
}

export const AGENDA: AgendaItem[] = deck.filter(hasTime).map((s) => ({
  slideId: s.id,
  time: s.time,
  minutes: parseClock(s.time),
  title: titleOf(s),
  presenter: presenterOf(s),
  kind: s.kind,
}));

const ORDER_INDEX = new Map(deck.map((s, i) => [s.id, i]));
const posOf = (slideId: string) => ORDER_INDEX.get(slideId) ?? -1;

/** The agenda item anchored at or before the given slide, in day order — "what's on now". */
export function agendaAt(slideId: string): AgendaItem | null {
  const pos = posOf(slideId);
  let found: AgendaItem | null = null;
  for (const item of AGENDA) if (posOf(item.slideId) <= pos) found = item;
  return found;
}

/** The next agenda item strictly after the given slide, in day order — "what's next". */
export function agendaAfter(slideId: string): AgendaItem | null {
  const pos = posOf(slideId);
  for (const item of AGENDA) if (posOf(item.slideId) > pos) return item;
  return null;
}

/** Block (KOMPOZYCJE) label for a slide, for when there's no agenda anchor yet (e.g. a loop
 *  before its first timed slide) — "Rejestracja i powitalna kawa" instead of nothing. */
export function blockLabelFor(slideId: string): string | null {
  const blok = KOMPOZYCJE.find((k) => k.slides.some((s) => s.id === slideId));
  if (!blok) return null;
  const label: Record<string, string> = {
    LoopRejestracja: 'Rejestracja i kawa powitalna',
    BlokOtwarcie: 'Otwarcie konferencji',
    BlokPrelekcjeI: 'Prelekcje — część I',
    LoopPrzerwa: 'Przerwa i networking',
    BlokPrelekcjeII: 'Prelekcje — część II i panel',
    LoopNetworking: 'Rozmowy przy stoiskach',
  };
  return label[blok.id] ?? blok.id;
}

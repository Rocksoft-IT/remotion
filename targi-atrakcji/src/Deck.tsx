import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { Slide } from '../slides';
import { SlideView } from './slides';
import { C, base } from './theme';

export type DeckProps = {
  slides: Slide[];
};

/**
 * Blok = sekwencja slajdow, dlugosci prosto z durationInFrames w danych.
 * Tlo bazowe zostaje pod spodem, wiec przejscia sa czystym przenikaniem,
 * a nie mignieciem czerni.
 */
export const Deck: React.FC<DeckProps> = ({ slides }) => {
  let from = 0;

  return (
    <AbsoluteFill style={{ ...base, backgroundColor: C.granat }}>
      {slides.map((slide) => {
        const at = from;
        from += slide.durationInFrames;
        return (
          <Sequence
  key={slide.id}
  from={at}
  durationInFrames={slide.durationInFrames}
  name={`${slide.id} (${slide.kind})`}>
            <SlideView slide={slide} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

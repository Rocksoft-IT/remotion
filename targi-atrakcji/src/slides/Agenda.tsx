import React from 'react';
import { Frame, Overline, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { C, HEIGHT, SAFE, TONE } from '../theme';
import { EVENT } from '../../slides';
import type { SlideProps } from './types';

/**
 * Program dnia musi zmiescic sie na jednym ekranie niezaleznie od liczby
 * pozycji, wiec wysokosc wiersza i stopien pisma licza sie z danych.
 * Dolna granica to 32 px, czyli prog czytelnosci z 15 metrow.
 */
const HEADER = 200;
const FOOTER = 60;

const rowMetrics = (count: number) => {
  const available = HEIGHT - 2 * SAFE - HEADER - FOOTER;
  const perRow = available / Math.max(1, count);
  const fontSize = Math.max(32, Math.min(56, Math.round((perRow - 34) / 1.15)));
  return { perRow, fontSize };
};

const Row: React.FC<{
  row: { time: string; label: string; accent?: boolean };
  index: number;
  duration: number;
  fontSize: number;
}> = ({ row, index, duration, fontSize }) => {
  const a = useEnterExit(duration, 8 + stagger(index, 3));

  return (
    <div
      style={{
        ...a.style,
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `${Math.round(fontSize * 4)}px 1fr`,
        alignItems: 'center',
        gap: 40,
        borderTop: `2px solid ${TONE.dark.line}`,
        minHeight: 0,
      }}
    >
      <div style={{ fontSize, fontWeight: 900, color: C.slonce, letterSpacing: '-0.01em' }}>{row.time}</div>
      <div style={{ fontSize, fontWeight: row.accent ? 800 : 500, color: row.accent ? C.slonce : TONE.dark.fg }}>
        {row.label}
      </div>
    </div>
  );
};

export const Agenda: React.FC<SlideProps<'agenda'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);
  const { fontSize } = rowMetrics(slide.rows.length);

  return (
    <Frame tone="dark" footer={`${EVENT.date} · ${EVENT.venue}`}>
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <Overline>{EVENT.editionLabel}</Overline>
        <Title size={88}>{slide.title}</Title>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {slide.rows.map((row, i) => (
          <Row
            key={row.time + row.label}
            row={row}
            index={i}
            duration={slide.durationInFrames}
            fontSize={fontSize}
          />
        ))}
      </div>
    </Frame>
  );
};

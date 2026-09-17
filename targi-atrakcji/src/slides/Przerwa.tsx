import React from 'react';
import { Fill, Frame, Overline } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { useCountdown } from '../components/useCountdown';
import { C, TONE } from '../theme';
import type { SlideProps } from './types';

/** Powyzej tego progu odliczanie nie ma sensu, wiec ekran pokazuje sama godzine. */
const MAX_COUNTDOWN_HOURS = 6;

export const Przerwa: React.FC<SlideProps<'przerwa'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);
  const clock = useEnterExit(slide.durationInFrames, 5);
  const { text, hours, isOver } = useCountdown(slide.backAtISO);

  const counting = !isOver && hours < MAX_COUNTDOWN_HOURS;
  const label = isOver
    ? 'Wracamy na scenę'
    : counting
      ? `Do powrotu na scenę, ${slide.backAt}`
      : 'Powrót na scenę';

  return (
    <Frame tone="dark">
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Overline>Przerwa</Overline>
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: '-0.025em', color: TONE.dark.fg }}>
          {slide.title}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 80 }}>
        <div style={{ ...clock.style, width: 880, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: TONE.dark.dim,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: counting ? 230 : 280,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: '-0.045em',
              color: C.slonce,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {counting ? text : slide.backAt}
          </div>
        </div>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
            flex: 1,
            minWidth: 0,
          }}
        >
          {slide.items.map((item, i) => (
            <BreakItem key={item} text={item} index={i} duration={slide.durationInFrames} />
          ))}
        </ul>
      </div>
    </Frame>
  );
};

const BreakItem: React.FC<{ text: string; index: number; duration: number }> = ({ text, index, duration }) => {
  const a = useEnterExit(duration, 10 + stagger(index, 4));
  return (
    <li style={{ ...a.style, display: 'flex', gap: 22, alignItems: 'flex-start', minWidth: 0 }}>
      <span style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: C.slonce, marginTop: 18, flexShrink: 0 }} />
      <span style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.3, color: TONE.dark.dim, minWidth: 0 }}>
        <Fill value={text} size={32} />
      </span>
    </li>
  );
};

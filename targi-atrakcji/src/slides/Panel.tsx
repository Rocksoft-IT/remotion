import React from 'react';
import { Fill, Frame, Overline, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { C, TONE } from '../theme';
import type { SlideProps } from './types';

const Seat: React.FC<{
  seat: { name: string; org: string };
  index: number;
  duration: number;
}> = ({ seat, index, duration }) => {
  const a = useEnterExit(duration, 12 + stagger(index, 3));
  return (
    <div
      style={{
        ...a.style,
        flex: '1 1 0',
        minWidth: 0,
        padding: '28px 30px',
        borderRadius: 22,
        backgroundColor: 'rgba(236,239,243,0.07)',
        border: `2px solid ${TONE.dark.line}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, color: TONE.dark.fg }}>
        <Fill value={seat.name} size={28} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: C.slonce }}>
        <Fill value={seat.org} size={26} />
      </div>
    </div>
  );
};

export const Panel: React.FC<SlideProps<'panel'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);
  const mod = useEnterExit(slide.durationInFrames, 8);

  return (
    <Frame tone="dark">
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Overline>Panel dyskusyjny</Overline>
          <span style={{ fontSize: 40, fontWeight: 900, color: TONE.dark.dim }}>{slide.time}</span>
        </div>
        <Title size={86}>{slide.title}</Title>
      </div>

      <div style={{ ...mod.style, marginTop: 24, fontSize: 40, fontWeight: 600, color: TONE.dark.dim }}>
        Prowadzi: <span style={{ color: TONE.dark.fg, fontWeight: 800 }}>{slide.moderator}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', marginTop: 44, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 22, width: '100%', alignItems: 'stretch' }}>
          {slide.seats.map((seat, i) => (
            <Seat key={`${seat.name}-${seat.org}`} seat={seat} index={i} duration={slide.durationInFrames} />
          ))}
        </div>
      </div>
    </Frame>
  );
};

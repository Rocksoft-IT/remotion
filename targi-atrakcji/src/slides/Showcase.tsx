import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Fill, Frame, Lead, Overline, Title } from '../components/ui';
import { stagger, useDrift, useEnterExit } from '../components/anim';
import { C, TONE } from '../theme';
import type { SlideProps } from './types';

export const Showcase: React.FC<SlideProps<'showcase'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);
  const lead = useEnterExit(slide.durationInFrames, 6);
  const drift = useDrift(22, 16);

  return (
    <Frame tone="dark">
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 60% at ${72 + drift / 6}% 80%, rgba(243,114,28,0.28) 0%, rgba(243,114,28,0) 65%)`,
        }}
      />

      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Overline>Na żywo</Overline>
        <Title size={104} weight={900}>
          {slide.title}
        </Title>
      </div>

      <div style={{ ...lead.style, marginTop: 26 }}>
        <Lead size={46}>{slide.lead}</Lead>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 24, width: '100%' }}>
          {slide.items.map((item, i) => (
            <Step key={item} text={item} index={i} duration={slide.durationInFrames} />
          ))}
        </div>
      </div>
    </Frame>
  );
};

const Step: React.FC<{ text: string; index: number; duration: number }> = ({ text, index, duration }) => {
  const a = useEnterExit(duration, 12 + stagger(index, 5));
  return (
    <div
      style={{
        ...a.style,
        flex: '1 1 0',
        padding: '30px 32px',
        borderRadius: 24,
        backgroundColor: 'rgba(236,239,243,0.07)',
        border: `2px solid ${TONE.dark.line}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 900, color: C.slonce }}>{String(index + 1).padStart(2, '0')}</div>
      <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.25, color: TONE.dark.fg }}>
        <Fill value={text} size={32} />
      </div>
    </div>
  );
};

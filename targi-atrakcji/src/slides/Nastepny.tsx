import React from 'react';
import { Frame, Title } from '../components/ui';
import { useEnterExit } from '../components/anim';
import { TONE } from '../theme';
import { Fill } from '../components/ui';
import type { SlideProps } from './types';

export const Nastepny: React.FC<SlideProps<'nastepny'>> = ({ slide }) => {
  const a = useEnterExit(slide.durationInFrames);
  const b = useEnterExit(slide.durationInFrames, 5);
  const c = useEnterExit(slide.durationInFrames, 10);

  return (
    <Frame tone="accent">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36 }}>
        <div
          style={{
            ...a.style,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: TONE.accent.dim,
          }}
        >
          {slide.label}
        </div>

        <div style={b.style}>
          <Title size={124} tone="accent" weight={900}>
            <Fill value={slide.title} tone="accent" size={64} />
          </Title>
        </div>

        {slide.name ? (
          <div style={{ ...c.style, fontSize: 62, fontWeight: 600, color: TONE.accent.fg, opacity: 0.92 }}>
            {slide.name}
          </div>
        ) : null}
      </div>
    </Frame>
  );
};

import React from 'react';
import { AccentRule, Frame, Title } from '../components/ui';
import { useEnterExit } from '../components/anim';
import { C } from '../theme';
import type { SlideProps } from './types';

export const Sekcja: React.FC<SlideProps<'sekcja'>> = ({ slide }) => {
  const a = useEnterExit(slide.durationInFrames);
  const b = useEnterExit(slide.durationInFrames, 6);

  return (
    <Frame tone="dark">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
        {slide.time ? (
          <div style={{ ...a.style, fontSize: 96, fontWeight: 900, color: C.slonce, letterSpacing: '-0.02em' }}>
            {slide.time}
          </div>
        ) : null}
        <div style={b.style}>
          <Title size={150} weight={900}>
            {slide.title}
          </Title>
        </div>
        <div style={b.style}>
          <AccentRule width={240} />
        </div>
      </div>
    </Frame>
  );
};

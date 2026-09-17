import React from 'react';
import { EVENT } from '../../slides';
import { AccentRule, Frame, Lead, Logo, Title } from '../components/ui';
import { useDrift, useEnterExit } from '../components/anim';
import { C } from '../theme';
import type { SlideProps } from './types';

export const Hero: React.FC<SlideProps<'hero'>> = ({ slide }) => {
  const a = useEnterExit(slide.durationInFrames);
  const b = useEnterExit(slide.durationInFrames, 6);
  const c = useEnterExit(slide.durationInFrames, 12);
  const drift = useDrift(10, 20);

  return (
    <Frame tone="dark" mark={false}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 44 }}>
        <div style={a.style}>
          <Logo tone="dark" height={120} />
        </div>

        <div style={{ ...b.style, display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: C.slonce,
            }}
          >
            {slide.overline}
          </div>
          <Title size={148} weight={900}>
            {slide.title}
          </Title>
        </div>

        <div style={{ ...c.style, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <AccentRule width={200} />
          <Lead size={48}>{slide.meta}</Lead>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: -320 + drift,
          bottom: -340,
          width: 900,
          height: 900,
          borderRadius: 999,
          background: `radial-gradient(circle, rgba(243,114,28,0.16) 0%, rgba(243,114,28,0) 68%)`,
        }}
      />
    </Frame>
  );
};

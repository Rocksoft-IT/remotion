import React from 'react';
import { Fill, Frame, Logo, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { Qr } from '../components/Qr';
import { TONE } from '../theme';
import type { SlideProps } from './types';

export const Zamkniecie: React.FC<SlideProps<'zamkniecie'>> = ({ slide }) => {
  const logo = useEnterExit(slide.durationInFrames);
  const head = useEnterExit(slide.durationInFrames, 5);
  const qr = useEnterExit(slide.durationInFrames, 16);

  return (
    <Frame tone="dark" mark={false}>
      <div style={{ flex: 1, display: 'flex', gap: 80, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={logo.style}>
            <Logo tone="dark" height={92} />
          </div>

          <div style={head.style}>
            <Title size={150} weight={900}>
              {slide.title}
            </Title>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {slide.lines.map((line, i) => (
              <Line key={line} text={line} index={i} duration={slide.durationInFrames} />
            ))}
          </div>
        </div>

        {slide.qr ? (
          <div style={qr.style}>
            <Qr value={slide.qr} size={320} caption="Ankieta i newsletter" />
          </div>
        ) : null}
      </div>
    </Frame>
  );
};

const Line: React.FC<{ text: string; index: number; duration: number }> = ({ text, index, duration }) => {
  const a = useEnterExit(duration, 10 + stagger(index, 4));
  return (
    <div style={{ ...a.style, fontSize: 42, fontWeight: 500, color: TONE.dark.dim, lineHeight: 1.3 }}>
      <Fill value={text} size={36} />
    </div>
  );
};

import React from 'react';
import { Fill, Frame, Overline, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { Qr } from '../components/Qr';
import { C, TONE } from '../theme';
import { EVENT } from '../../slides';
import type { SlideProps } from './types';

const Item: React.FC<{ text: string; index: number; duration: number }> = ({ text, index, duration }) => {
  const a = useEnterExit(duration, 8 + stagger(index, 4));
  return (
    <li style={{ ...a.style, display: 'flex', gap: 26, alignItems: 'flex-start' }}>
      <span style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: C.slonce, marginTop: 22, flexShrink: 0 }} />
      <span style={{ fontSize: 50, fontWeight: 500, lineHeight: 1.3, color: TONE.dark.fg }}>
        <Fill value={text} size={42} />
      </span>
    </li>
  );
};

export const Praktyczne: React.FC<SlideProps<'praktyczne'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);
  const qr = useEnterExit(slide.durationInFrames, 14);

  return (
    <Frame tone="dark" footer={EVENT.venue}>
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 52 }}>
        <Overline>Informacje</Overline>
        <Title size={100}>{slide.title}</Title>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 80, alignItems: 'flex-start' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 28, flex: 1 }}>
          {slide.items.map((item, i) => (
            <Item key={item} text={item} index={i} duration={slide.durationInFrames} />
          ))}
        </ul>

        {slide.qr ? (
          <div style={qr.style}>
            <Qr value={slide.qr} size={300} />
          </div>
        ) : null}
      </div>
    </Frame>
  );
};

import React from 'react';
import { Fill, Frame, Overline, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { C, TONE } from '../theme';
import { EVENT } from '../../slides';
import type { SlideProps } from './types';

export const Patroni: React.FC<SlideProps<'patroni'>> = ({ slide }) => {
  const head = useEnterExit(slide.durationInFrames);

  return (
    <Frame tone="light" footer={EVENT.editionLabel}>
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 52 }}>
        <Overline tone="light">Pod patronatem</Overline>
        <Title size={96} tone="light">
          {slide.title}
        </Title>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 26, alignItems: 'stretch', minHeight: 0 }}>
        {slide.honorary.map((entry, i) => (
          <Card key={entry} text={entry} index={i} duration={slide.durationInFrames} />
        ))}
      </div>

      {slide.media?.length ? (
        <div style={{ marginTop: 48, paddingTop: 40, marginBottom: 18, borderTop: `2px solid ${TONE.light.line}` }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: TONE.light.dim,
              marginBottom: 20,
            }}
          >
            Patronaty medialne
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
            {slide.media.map((item) => (
              <span key={item} style={{ fontSize: 38, fontWeight: 600, color: TONE.light.fg }}>
                <Fill value={item} tone="light" size={34} />
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Frame>
  );
};

const Card: React.FC<{ text: string; index: number; duration: number }> = ({ text, index, duration }) => {
  const a = useEnterExit(duration, 8 + stagger(index, 4));
  return (
    <div
      style={{
        ...a.style,
        flex: '1 1 0',
        padding: '44px 38px',
        justifyContent: 'center',
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        border: `2px solid ${TONE.light.line}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ width: 84, height: 8, borderRadius: 999, backgroundColor: C.slonce }} />
      <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.15, color: TONE.light.fg }}>
        <Fill value={text} tone="light" size={36} />
      </div>
    </div>
  );
};

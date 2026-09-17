import React from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { Fill, Frame, Overline, Title } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { C, TONE } from '../theme';
import { photoSrc } from '../assets';
import { useAsset } from '../components/useAsset';
import type { OfKind, SlideProps } from './types';

type Item = OfKind<'partnerzy'>['items'][number];

const PER_PAGE = 12;

const chunk = <T,>(arr: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size) as T[]);
  return out.length ? out : [[]];
};

const LogoTile: React.FC<{ item: Item; index: number; duration: number }> = ({ item, index, duration }) => {
  const a = useEnterExit(duration, 8 + stagger(index, 2));
  const src = photoSrc(item.logo);
  const state = useAsset(src);

  return (
    <div
      style={{
        ...a.style,
        backgroundColor: '#FFFFFF',
        border: `2px solid ${TONE.light.line}`,
        borderRadius: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 22,
        minHeight: 0,
        textAlign: 'center',
      }}
    >
      {src && state === 'ok' ? (
        <Img src={src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ fontSize: 34, fontWeight: 700, color: TONE.light.fg, lineHeight: 1.2 }}>
          <Fill value={item.name} tone="light" size={28} />
          {item.booth ? (
            <div style={{ fontSize: 26, fontWeight: 600, color: C.slonce, marginTop: 8 }}>{item.booth}</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const Single: React.FC<{ item: Item; duration: number }> = ({ item, duration }) => {
  const a = useEnterExit(duration);
  const src = photoSrc(item.logo);
  const state = useAsset(src);

  return (
    <div style={{ ...a.style, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 34 }}>
      {src && state === 'ok' ? (
        <Img src={src} style={{ maxHeight: 300, maxWidth: 760, objectFit: 'contain', alignSelf: 'flex-start' }} />
      ) : null}

      <div style={{ fontSize: 108, fontWeight: 900, letterSpacing: '-0.025em', color: TONE.light.fg, lineHeight: 1.05 }}>
        <Fill value={item.name} tone="light" size={56} />
      </div>

      {item.booth ? (
        <div
          style={{
            alignSelf: 'flex-start',
            fontSize: 42,
            fontWeight: 800,
            padding: '14px 30px',
            borderRadius: 999,
            backgroundColor: C.slonce,
            color: '#FFFFFF',
          }}
        >
          Stoisko {item.booth}
        </div>
      ) : null}

      {item.claim ? (
        <div style={{ fontSize: 48, fontWeight: 500, color: TONE.light.dim, maxWidth: '78%', lineHeight: 1.28 }}>
          <Fill value={item.claim} tone="light" size={40} />
        </div>
      ) : null}
    </div>
  );
};

export const Partnerzy: React.FC<SlideProps<'partnerzy'>> = ({ slide }) => {
  const frame = useCurrentFrame();
  const head = useEnterExit(slide.durationInFrames);

  if (slide.layout === 'single') {
    // Jeden ekran na wystawce: dane dziela czas slajdu po rowno.
    const count = Math.max(1, slide.items.length);
    const per = slide.durationInFrames / count;
    const index = Math.min(count - 1, Math.floor(frame / per));
    const item = slide.items[index];

    return (
      <Frame tone="light" footer={`${index + 1} / ${count}`}>
        <div style={{ ...head.style, marginBottom: 26 }}>
          <Overline tone="light">{slide.title}</Overline>
        </div>
        <Single key={index} item={item} duration={Math.round(per)} />
      </Frame>
    );
  }

  // Siatka 4 x 3. Powyzej 12 logotypow slajd stronicuje sie sam.
  const pages = chunk(slide.items, PER_PAGE);
  const per = slide.durationInFrames / pages.length;
  const page = Math.min(pages.length - 1, Math.floor(frame / per));

  return (
    <Frame tone="light" footer={pages.length > 1 ? `Strona ${page + 1} z ${pages.length}` : undefined}>
      <div style={{ ...head.style, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
        <Overline tone="light">Dziękujemy za wsparcie</Overline>
        <Title size={86} tone="light">
          {slide.title}
        </Title>
      </div>

      <div
        key={page}
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: `repeat(${Math.min(3, Math.ceil(pages[page].length / 4)) || 1}, 1fr)`,
          gap: 24,
        }}
      >
        {pages[page].map((item, i) => (
          <LogoTile key={item.name + i} item={item} index={i} duration={Math.round(per)} />
        ))}
      </div>
    </Frame>
  );
};

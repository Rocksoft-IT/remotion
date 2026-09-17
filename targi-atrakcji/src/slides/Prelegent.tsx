import React from 'react';
import { Img } from 'remotion';
import { Fill, Frame } from '../components/ui';
import { stagger, useEnterExit } from '../components/anim';
import { C, TONE, ToneName } from '../theme';
import { isTodo, photoSrc } from '../assets';
import { useAsset } from '../components/useAsset';
import type { OfKind, SlideProps } from './types';

const BADGE: Record<
  NonNullable<OfKind<'prelegent'>['badge']>,
  { label: string; tone: ToneName; bg: string; fg: string }
> = {
  prelekcja: { label: 'Prelekcja', tone: 'dark', bg: C.slonce, fg: '#FFFFFF' },
  prowadzenie: { label: 'Prowadzenie', tone: 'dark', bg: 'rgba(236,239,243,0.14)', fg: C.mgla },
  patron: { label: 'Patronat honorowy', tone: 'dark', bg: 'rgba(236,239,243,0.14)', fg: C.mgla },
  partner: { label: 'Partner targów', tone: 'light', bg: C.granat, fg: C.mgla },
};

const Portrait: React.FC<{ name: string; photo?: string; tone: ToneName }> = ({ name, photo, tone }) => {
  const src = photoSrc(photo);
  const state = useAsset(src);
  const initials = isTodo(name)
    ? '?'
    : name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('');

  const box: React.CSSProperties = {
    width: 460,
    height: 560,
    borderRadius: 32,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: tone === 'light' ? 'rgba(9,36,66,0.06)' : 'rgba(236,239,243,0.07)',
    border: `3px solid ${TONE[tone].line}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (src && state === 'ok') {
    return (
      <div style={box}>
        <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={box}>
      <span style={{ fontSize: 180, fontWeight: 900, color: TONE[tone].dim, letterSpacing: '-0.03em' }}>
        {initials}
      </span>
    </div>
  );
};

export const Prelegent: React.FC<SlideProps<'prelegent'>> = ({ slide }) => {
  const badge = BADGE[slide.badge ?? 'prelekcja'];
  const tone = badge.tone;
  const t = TONE[tone];

  const photoAnim = useEnterExit(slide.durationInFrames);
  const head = useEnterExit(slide.durationInFrames, 4);
  const name = useEnterExit(slide.durationInFrames, 8);
  const talk = useEnterExit(slide.durationInFrames, 12);

  return (
    <Frame tone={tone}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 72 }}>
        <div style={photoAnim.style}>
          <Portrait name={slide.name} photo={slide.photo} tone={tone} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
          <div style={{ ...head.style, display: 'flex', alignItems: 'center', gap: 24 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                borderRadius: 999,
                backgroundColor: badge.bg,
                color: badge.fg,
              }}
            >
              {badge.label}
            </span>
            <span style={{ fontSize: 46, fontWeight: 900, color: C.slonce }}>{slide.time}</span>
          </div>

          {/* Zasada redakcyjna: nazwisko zawsze wieksze od tytulu prelekcji. */}
          <div style={{ ...name.style, fontSize: 104, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.025em', color: t.fg }}>
            <Fill value={slide.name} tone={tone} size={56} />
          </div>

          <div style={{ ...name.style, fontSize: 46, fontWeight: 600, color: t.dim }}>
            <Fill value={slide.org} tone={tone} size={40} />
            {slide.role ? <span style={{ opacity: 0.75 }}>{` · ${slide.role}`}</span> : null}
          </div>

          <div style={{ ...talk.style, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ width: 8, borderRadius: 999, backgroundColor: C.slonce, flexShrink: 0 }} />
              <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.15, color: t.fg }}>
                {slide.talkTitle}
              </div>
            </div>

            {slide.bullets?.length ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {slide.bullets.map((bullet, i) => (
                  <Bullet key={bullet} text={bullet} index={i} duration={slide.durationInFrames} tone={tone} />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </Frame>
  );
};

const Bullet: React.FC<{ text: string; index: number; duration: number; tone: ToneName }> = ({
  text,
  index,
  duration,
  tone,
}) => {
  const a = useEnterExit(duration, 16 + stagger(index, 4));
  return (
    <li style={{ ...a.style, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <span style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: C.slonce, marginTop: 16, flexShrink: 0 }} />
      <span style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.28, color: TONE[tone].dim }}>
        <Fill value={text} tone={tone} size={34} />
      </span>
    </li>
  );
};

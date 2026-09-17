import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { EVENT } from '../../slides';
import { LOGO, isTodo, todoLabel } from '../assets';
import { C, FONT, SAFE, TONE, ToneName, base } from '../theme';
import { useAsset } from './useAsset';

/* ----------------------------------------------------------------- logo */

export const Logo: React.FC<{ tone: ToneName; height?: number }> = ({ tone, height = 92 }) => {
  const src = tone === 'light' ? LOGO.dark : LOGO.light;
  const state = useAsset(src);
  const fg = TONE[tone].fg;

  if (state === 'ok') return <Img src={src} style={{ height, width: 'auto' }} />;

  // Sygnatura zastepcza do czasu wgrania plikow logo do public/logo/.
  return (
    <div style={{ ...base, color: fg, lineHeight: 1 }}>
      <div style={{ fontSize: height * 0.42, fontWeight: 900, letterSpacing: '0.02em' }}>
        TARGI ATRAKCJI
      </div>
      <div style={{ fontSize: height * 0.24, fontWeight: 600, letterSpacing: '0.30em', opacity: 0.7, marginTop: 6 }}>
        ŚLĄSKA CIESZYŃSKIEGO
      </div>
    </div>
  );
};

export const Mark: React.FC<{ tone: ToneName }> = ({ tone }) => {
  const state = useAsset(LOGO.mark);
  if (state === 'ok') {
    return <Img src={LOGO.mark} style={{ height: 96, width: 'auto', opacity: 0.95 }} />;
  }
  return (
    <div
      style={{
        ...base,
        width: 92,
        height: 92,
        borderRadius: 999,
        border: `4px solid ${TONE[tone].line}`,
        color: TONE[tone].dim,
        fontSize: 34,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      TA
    </div>
  );
};

/* ---------------------------------------------------------------- ramka */

export const Frame: React.FC<{
  tone?: ToneName;
  mark?: boolean;
  logo?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ tone = 'dark', mark = true, logo = false, footer, children }) => {
  const t = TONE[tone];
  return (
    <AbsoluteFill style={{ ...base, backgroundColor: t.bg, color: t.fg }}>
      {tone === 'dark' ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 90% at 12% 0%, ${C.granatSoft} 0%, ${C.granat} 62%)`,
          }}
        />
      ) : null}

      <AbsoluteFill style={{ padding: SAFE, display: 'flex', flexDirection: 'column' }}>
        {logo ? <div style={{ marginBottom: 48 }}><Logo tone={tone} /></div> : null}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
        {footer ? (
          <div style={{ fontSize: 30, fontWeight: 500, color: t.dim, letterSpacing: '0.01em' }}>
            {footer}
          </div>
        ) : null}
      </AbsoluteFill>

      {mark ? (
        <div style={{ position: 'absolute', right: SAFE * 0.66, bottom: SAFE * 0.55 }}>
          <Mark tone={tone} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ typografia */

export const Overline: React.FC<{ tone?: ToneName; children: React.ReactNode }> = ({
  tone = 'dark',
  children,
}) => (
  <div
    style={{
      fontSize: 34,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: tone === 'accent' ? TONE.accent.dim : C.slonce,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{
  size?: number;
  tone?: ToneName;
  weight?: number;
  children: React.ReactNode;
}> = ({ size = 116, tone = 'dark', weight = 800, children }) => (
  <div
    style={{
      fontSize: size,
      lineHeight: 1.04,
      fontWeight: weight,
      letterSpacing: '-0.02em',
      color: TONE[tone].fg,
      maxWidth: '90%',
      textWrap: 'balance',
    }}
  >
    {children}
  </div>
);

export const Lead: React.FC<{ tone?: ToneName; size?: number; children: React.ReactNode }> = ({
  tone = 'dark',
  size = 44,
  children,
}) => (
  <div style={{ fontSize: size, fontWeight: 500, lineHeight: 1.35, color: TONE[tone].dim, maxWidth: '78%' }}>
    {children}
  </div>
);

export const AccentRule: React.FC<{ width?: number }> = ({ width = 168 }) => (
  <div style={{ width, height: 10, borderRadius: 999, backgroundColor: C.slonce }} />
);

/* ------------------------------------------------------- placeholder TODO */

export const TodoChip: React.FC<{ value: string; tone?: ToneName; size?: number }> = ({
  value,
  tone = 'dark',
  size = 38,
}) => (
  <span
    style={{
      display: 'inline-block',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '10px 20px',
      borderRadius: 14,
      border: `3px dashed ${C.slonce}`,
      color: C.slonce,
      backgroundColor: tone === 'light' ? 'rgba(243,114,28,0.08)' : 'rgba(243,114,28,0.12)',
      lineHeight: 1.2,
      overflowWrap: 'anywhere',
    }}
  >
    <span
      style={{
        display: 'block',
        fontSize: Math.max(20, size * 0.58),
        fontWeight: 800,
        letterSpacing: '0.14em',
        opacity: 0.8,
        marginBottom: 4,
      }}
    >
      DO UZUPEŁNIENIA
    </span>
    <span style={{ display: 'block', fontSize: size, fontWeight: 600 }}>{todoLabel(value)}</span>
  </span>
);

/** Tekst albo chip TODO. Jedno miejsce decyzji dla calego decku. */
export const Fill: React.FC<{
  value?: string;
  tone?: ToneName;
  size?: number;
  style?: React.CSSProperties;
}> = ({ value, tone = 'dark', size = 40, style }) => {
  if (!value) return null;
  if (isTodo(value)) return <TodoChip value={value} tone={tone} size={size * 0.9} />;
  return <span style={{ fontFamily: FONT, ...style }}>{value}</span>;
};

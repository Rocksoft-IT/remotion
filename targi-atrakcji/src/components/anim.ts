import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const IN_FRAMES = 18;
const OUT_FRAMES = 12;

/**
 * Wejscie i wyjscie slajdu. Frame jest lokalny dla <Sequence>, wiec kazdy slajd
 * animuje sie tak samo niezaleznie od tego, gdzie stoi w bloku.
 */
export const useEnterExit = (durationInFrames: number, delayFrames = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 200, mass: 0.6 },
    durationInFrames: IN_FRAMES,
  });

  const exit = interpolate(
    frame,
    [durationInFrames - OUT_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return {
    opacity: enter * exit,
    y: (1 - enter) * 28,
    enter,
    exit,
    /** gotowy styl do rozlozenia na kontenerze */
    style: {
      opacity: enter * exit,
      transform: `translateY(${(1 - enter) * 28}px)`,
    } as React.CSSProperties,
  };
};

/** Kaskada dla list: kazdy element wchodzi 4 klatki po poprzednim. */
export const stagger = (index: number, step = 4) => index * step;

/** Powolny dryf tla, zeby ekran nie wygladal na zawieszony w petli. */
export const useDrift = (amplitude = 14, periodSeconds = 24) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / (fps * periodSeconds)) * Math.PI * 2) * amplitude;
};

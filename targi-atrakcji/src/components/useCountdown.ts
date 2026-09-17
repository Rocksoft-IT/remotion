import { getRemotionEnvironment, useCurrentFrame, useVideoConfig } from 'remotion';

const BUNDLE_START = Date.now();

/**
 * Odliczanie do godziny z danych (backAtISO).
 *
 * Podglad w Studio: zegar chodzi wedlug realnego czasu, wiec 24.09 o 13:12
 * na ekranie widac faktyczne 48 minut.
 * Render do pliku: zegar startuje od momentu renderu i tyka plynnie, wiec plik
 * bloku D warto wyrenderowac tego samego dnia rano.
 */
export const useCountdown = (targetISO: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const now = getRemotionEnvironment().isRendering
    ? BUNDLE_START + (frame / fps) * 1000
    : Date.now();

  const target = new Date(targetISO).getTime();
  const msLeft = Math.max(0, target - now);

  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    msLeft,
    isOver: msLeft === 0,
    hours,
    minutes,
    seconds,
    /** HH:MM:SS albo MM:SS, zaleznie od tego, ile zostalo */
    text: hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`,
  };
};

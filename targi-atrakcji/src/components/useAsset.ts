import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

type State = 'loading' | 'ok' | 'missing';

/**
 * Sprawdza, czy plik graficzny istnieje, zanim render pojdzie dalej.
 * Brakujacy plik nie przerywa renderu, tylko wlacza fallback w komponencie.
 */
export const useAsset = (src?: string): State => {
  const [state, setState] = useState<State>(src ? 'loading' : 'missing');

  useEffect(() => {
    if (!src) {
      setState('missing');
      return;
    }
    const handle = delayRender(`Sprawdzam zasób: ${src}`);
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setState('ok');
      continueRender(handle);
    };
    img.onerror = () => {
      if (!cancelled) setState('missing');
      continueRender(handle);
    };
    img.src = src;
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [src]);

  return state;
};

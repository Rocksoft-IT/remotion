/**
 * Phase 0 spike (see plan: steady-purring-spring.md). Throwaway, not part of the product.
 * Proves/disproves: a Remotion <Player> chrome slide and a plain <video> presenter-media
 * overlay can share one screen, crossfade cleanly in both directions, and survive blank
 * (pause-in-place, not destroy) — without fighting Remotion's frame-locked model.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import { FPS, sec, type Slide } from '../slides';
import { Deck } from '../src/Deck';
import { WIDTH, HEIGHT, base } from '../src/theme';

const CHROME_SLIDES: Slide[] = [
  { id: 'spike-sekcja', kind: 'sekcja', durationInFrames: sec(6), title: 'Rozmowy przy stoiskach' },
];
const CHROME_DURATION = sec(6);
const FADE_MS = 220;

/** Same shape as renderer/stage.html's crossfade(): incoming stacks on top, fades 0->1;
 *  outgoing never moves, so the floor is always at least as bright as whichever slide is fully opaque. */
function crossfade(incoming: HTMLElement, outgoing: HTMLElement, fadeMs: number): Promise<void> {
  return new Promise((resolve) => {
    incoming.style.zIndex = '2';
    outgoing.style.zIndex = '1';
    if (!(fadeMs > 0)) { incoming.style.opacity = '1'; resolve(); return; }
    incoming.style.transition = 'none';
    incoming.style.opacity = '0';
    void incoming.offsetHeight;
    incoming.style.transition = `opacity ${fadeMs}ms linear`;
    requestAnimationFrame(() => { incoming.style.opacity = '1'; });
    let done = false;
    const finish = () => { if (done) return; done = true; incoming.removeEventListener('transitionend', onEnd); incoming.style.transition = ''; resolve(); };
    const onEnd = (e: TransitionEvent) => { if (e.target === incoming && e.propertyName === 'opacity') finish(); };
    incoming.addEventListener('transitionend', onEnd);
    setTimeout(finish, fadeMs + 200);
  });
}

type Current = 'chrome' | 'video';

const Spike: React.FC = () => {
  const [current, setCurrent] = useState<Current>('chrome');
  const [blank, setBlank] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chromeLayerRef = useRef<HTMLDivElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const pushLog = useCallback(
    (s: string) => setLog((l) => [...l.slice(-14), `${(performance.now() / 1000).toFixed(2)}s  ${s}`]),
    [],
  );

  const prevCurrent = useRef<Current>('chrome');
  useEffect(() => {
    if (prevCurrent.current === current) return;
    const incoming = current === 'chrome' ? chromeLayerRef.current : videoLayerRef.current;
    const outgoing = prevCurrent.current === 'chrome' ? chromeLayerRef.current : videoLayerRef.current;
    prevCurrent.current = current;
    pushLog(`switch -> ${current}`);
    if (incoming && outgoing) crossfade(incoming, outgoing, FADE_MS).then(() => pushLog(`crossfade settled @ ${current}`));
  }, [current, pushLog]);

  useEffect(() => {
    const v = videoRef.current;
    const p = playerRef.current;
    if (current === 'video') {
      if (blank) { v?.pause(); pushLog('video.pause (blank)'); }
      else {
        v?.play()
          .then(() => pushLog('video.play ok'))
          .catch((e) => pushLog(`video.play FAILED: ${e.message}`));
      }
    } else {
      if (blank) { p?.pause(); pushLog('player.pause (blank)'); }
      else { p?.play(); pushLog('player.play (unblank)'); }
    }
  }, [current, blank, pushLog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setCurrent((c) => (c === 'chrome' ? 'video' : 'chrome')); }
      else if (e.key === 'b' || e.key === 'B') setBlank((b) => !b);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Deterministic control for the Electron probe script — no synthetic key events needed.
  useEffect(() => {
    (window as any).__spike = {
      goto: (which: Current) => setCurrent(which),
      setBlank: (b: boolean) => setBlank(b),
      state: () => ({
        current,
        blank,
        videoTime: videoRef.current ? videoRef.current.currentTime : null,
        videoPaused: videoRef.current ? videoRef.current.paused : null,
      }),
    };
  }, [current, blank]);

  const layerStyle: React.CSSProperties = { position: 'absolute', inset: 0, opacity: 1 };

  return (
    <div style={{ ...base, position: 'fixed', inset: 0, background: '#000' }}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <div ref={chromeLayerRef} style={layerStyle}>
          <Player
            ref={playerRef}
            component={Deck}
            inputProps={{ slides: CHROME_SLIDES }}
            durationInFrames={CHROME_DURATION}
            fps={FPS}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            style={{ width: '100%', height: '100%' }}
            controls={false}
            loop
            autoPlay
          />
        </div>
        <div ref={videoLayerRef} style={{ ...layerStyle, background: '#000' }}>
          <video
            ref={videoRef}
            src="/video/spike-intro.mp4"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            playsInline
          />
        </div>
      </div>
      {blank ? <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999 }} /> : null}
      <div
        style={{
          position: 'fixed', left: 8, top: 8, zIndex: 10000, font: '11px monospace', color: '#0f0',
          background: 'rgba(0,0,0,.65)', padding: '4px 8px', maxWidth: 460, whiteSpace: 'pre-wrap',
        }}
      >
        current={current} blank={String(blank)}{'\n'}
        {log.join('\n')}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<Spike />);

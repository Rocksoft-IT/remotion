import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import { FPS, totalDuration } from '../slides';
import { Deck } from '../src/Deck';
import { HEIGHT, WIDTH, base } from '../src/theme';
import { DEFAULT_STATE, slidesFor, type StageState } from './bus';
import { talkFor } from './talks';

/** Klatka, na ktorej obraz zamiera: tuz przed animacja wyjscia slajdu. */
const HOLD_MARGIN = 13;
const FADE_MS = 220;

/**
 * Reveal `incoming` over `outgoing` with a crossfade, same mechanism proven in the Phase 0 spike
 * (plan: steady-purring-spring.md) and in the sibling Electron app's renderer/stage.html:
 * `outgoing` never fades itself, only `incoming` animates in on top — so the floor is always at
 * least as bright as whichever side is fully opaque, and there is no black-flash window.
 *
 * Returns a Promise that resolves once the fade has actually finished, not once it's merely
 * started — the caller needs that: tearing down the outgoing side's content (releasing a video
 * element) is only safe once it's no longer visually load-bearing, and it is load-bearing for the
 * entire fade, not just the instant it began. Doing that teardown right after *starting* the
 * animation (this function used to be fire-and-forget) blanked the still-visible outgoing layer
 * partway through — caught by the luminance probe as a black dip on the talk->chrome transition.
 */
function crossfade(incoming: HTMLElement, outgoing: HTMLElement, fadeMs: number): Promise<void> {
  incoming.style.zIndex = '2';
  outgoing.style.zIndex = '1';
  if (!(fadeMs > 0)) {
    incoming.style.opacity = '1';
    return Promise.resolve();
  }
  incoming.style.transition = 'none';
  incoming.style.opacity = '0';
  void incoming.offsetHeight; // commit opacity:0 before animating to 1
  incoming.style.transition = `opacity ${fadeMs}ms linear`;
  requestAnimationFrame(() => {
    incoming.style.opacity = '1';
  });
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      incoming.removeEventListener('transitionend', onEnd);
      incoming.style.transition = '';
      resolve();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === incoming && e.propertyName === 'opacity') finish();
    };
    incoming.addEventListener('transitionend', onEnd);
    setTimeout(finish, fadeMs + 200); // safety valve if the transitionend event is lost
  });
}

const Scena: React.FC = () => {
  const [state, setState] = useState<StageState>(DEFAULT_STATE);
  const [chromeVisible, setChromeVisible] = useState(true);
  const playerRef = useRef<PlayerRef>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chromeLayerRef = useRef<HTMLDivElement>(null);
  const mediaLayerRef = useRef<HTMLDivElement>(null);
  // Set when a manual (non-loop) chrome slide has already frozen on its last frame; blanking and
  // un-blanking must not un-freeze it, only a still-playing slide should resume.
  const frozenAtHold = useRef(false);

  useEffect(() => {
    window.deck.onState((p) => setState(p.state));
    window.deck.requestState();
  }, []);

  const talk = state.source.kind === 'wystapienie' ? talkFor(state.source.slideId) : null;
  // A live talk has no video -> nothing to show visually -> fall back to the branded intro card
  // for that slide rather than a dead black screen (same "missing asset never breaks the show"
  // discipline as everywhere else in this project).
  const wantMedia = state.source.kind === 'wystapienie' && !!talk?.video;
  const chromeSource = state.source.kind === 'wystapienie' ? { kind: 'slajd' as const, id: state.source.slideId } : state.source;
  const slides = useMemo(() => slidesFor(chromeSource), [chromeSource]);
  const duration = Math.max(1, totalDuration(slides));
  const holdFrame = Math.max(0, duration - HOLD_MARGIN);

  useEffect(() => {
    frozenAtHold.current = false;
  }, [state.seq, state.loop, holdFrame]);

  // Tryb "hold" dla kart chrome: dojedz do konca wejscia i zatrzymaj sie.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || state.loop) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      if (e.detail.frame >= holdFrame) {
        frozenAtHold.current = true;
        player.pause();
        player.seekTo(holdFrame);
      }
    };
    player.addEventListener('frameupdate', onFrame);
    return () => player.removeEventListener('frameupdate', onFrame);
  }, [state.loop, state.seq, holdFrame]);

  // Point the plain <video>/<audio> elements at this talk's files. Not part of Remotion's
  // Sequence timeline on purpose — Phase 0 proved fighting Remotion's frame-locked model for an
  // arbitrary-duration live talk isn't necessary when the real media is just plain HTML media.
  // Only ever ASSIGNS a new src here, never clears one: clearing is release-what-we-just-left
  // work, done in the crossfade effect below only after the outgoing layer is safely hidden —
  // doing it here instead raced the crossfade, since `talk` goes null the instant `wantMedia`
  // flips false (leaving `wystapienie`), which fired `v.load()` — resetting the element's
  // rendered frame to blank — on the layer that was still the fully-visible outgoing side of the
  // transition. Caught by the luminance probe: talk->chrome dipped to pure black.
  useEffect(() => {
    const v = videoRef.current;
    // No leading slash: root-absolute breaks under Electron's file:// loadFile() the same way
    // Vite's default asset base did (see vite.config.ts) — relative resolves correctly under
    // both file:// (this document sits directly in out/pulpit/) and the LAN server (role path
    // '/scena' has '/' as its directory, matching outDir's root either way).
    if (!v || !talk?.video || v.getAttribute('src') === talk.video) return;
    v.setAttribute('src', talk.video);
    v.load();
  }, [talk?.video]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !talk?.audio || a.getAttribute('src') === talk.audio) return;
    a.setAttribute('src', talk.audio);
    a.load();
  }, [talk?.audio]);

  // Crossfade whenever what's actually on screen flips between the Remotion chrome and the plain
  // media overlay. Waits for the incoming side to actually be paintable first — a fresh <Player>
  // mount (endTalk bumps `seq`, which changes its `key`) takes noticeably longer than the 220ms
  // fade to render its first frame, and firing the crossfade immediately showed the chrome
  // layer's transparent div over the black root background underneath for a beat (caught by the
  // luminance probe: talk->chrome dipped to ~5 while chrome->talk and every other transition
  // stayed clean). Same "wait for paintable, then swap" discipline as the sibling Electron app's
  // renderer/stage.html.
  const prevWantMedia = useRef(wantMedia);
  const transitionToken = useRef(0);
  useEffect(() => {
    if (prevWantMedia.current === wantMedia) return;
    prevWantMedia.current = wantMedia;
    const token = ++transitionToken.current;

    if (wantMedia && videoRef.current && !state.blank) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    const whenPaintable = (): Promise<void> =>
      new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (wantMedia) videoRef.current?.removeEventListener('loadeddata', finish);
          else playerRef.current?.removeEventListener('frameupdate', finish);
          resolve();
        };
        const timer = setTimeout(finish, 700); // safety valve — a slow/stuck mount must not hang the cut
        if (wantMedia) {
          const v = videoRef.current;
          if (!v || v.readyState >= 2) return finish();
          v.addEventListener('loadeddata', finish, { once: true });
        } else {
          const player = playerRef.current;
          if (!player) return finish();
          player.addEventListener('frameupdate', finish);
        }
      });

    whenPaintable()
      .then(() => {
        if (token !== transitionToken.current) return Promise.resolve(); // a newer transition already won
        const incoming = wantMedia ? mediaLayerRef.current : chromeLayerRef.current;
        const outgoing = wantMedia ? chromeLayerRef.current : mediaLayerRef.current;
        return incoming && outgoing ? crossfade(incoming, outgoing, FADE_MS) : Promise.resolve();
      })
      .then(() => {
        // Only now — fade actually finished, outgoing side is no longer visually load-bearing —
        // release the video/audio we just left, same discipline as renderer/stage.html's
        // "release the slide we just left". Tearing this down any earlier (even right after
        // *starting* the fade) blanks the still-visible outgoing layer mid-transition.
        if (token !== transitionToken.current || wantMedia) return;
        const v = videoRef.current;
        if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
        const a = audioRef.current;
        if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
      });
  }, [wantMedia]);

  // Blank pauses whatever is actually active IN PLACE — video/audio position and the chrome
  // Player's frame are both preserved, never reset. Un-blanking resumes: the media overlay if a
  // talk is live, the Player otherwise (unless it had already frozen on its hold frame).
  useEffect(() => {
    const player = playerRef.current;
    const v = videoRef.current;
    const a = audioRef.current;
    if (state.blank) {
      player?.pause();
      v?.pause();
      a?.pause();
      return;
    }
    if (wantMedia) v?.play().catch(() => {});
    else if (!frozenAtHold.current) player?.play();
    if (talk?.audio) a?.play().catch(() => {});
  }, [state.blank, wantMedia, talk?.audio]);

  // Kursor znika po chwili bezruchu — samo okno jest juz pelnoekranowe (Electron, bez ramki,
  // rozmiar calego ekranu sceny).
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setChromeVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setChromeVisible(false), 2500);
    };
    wake();
    window.addEventListener('mousemove', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      style={{
        ...base,
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        overflow: 'hidden',
        cursor: chromeVisible ? 'default' : 'none',
      }}
    >
      <div ref={chromeLayerRef} style={{ position: 'absolute', inset: 0, opacity: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 'min(100vw, calc(100vh * 16 / 9))', aspectRatio: '16 / 9' }}>
          <Player
            key={`${state.seq}-${state.loop}`}
            ref={playerRef}
            component={Deck}
            inputProps={{ slides }}
            durationInFrames={duration}
            fps={FPS}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            style={{ width: '100%', height: '100%' }}
            controls={false}
            loop={state.loop}
            autoPlay
            showPosterWhenPaused={false}
            // Resolved (plan: steady-purring-spring.md, Day 0): the show-day operator is Konfero,
            // a <3-employee org, which qualifies for Remotion's free tier as the "User" who runs
            // the finished app — this isn't skipping a check, it's stating that conclusion.
            acknowledgeRemotionLicense
          />
        </div>
      </div>

      <div ref={mediaLayerRef} style={{ position: 'absolute', inset: 0, opacity: 0, background: '#000' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline />
      </div>

      {/* Backing audio for a talk that has one — independent of which visual layer is on top. */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {state.blank ? <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999 }} /> : null}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<Scena />);

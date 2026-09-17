import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Thumbnail } from '@remotion/player';
import { EVENT, FPS, KOMPOZYCJE, deck, totalDuration, type Slide } from '../slides';
import { Deck } from '../src/Deck';
import { C, HEIGHT, WIDTH, base } from '../src/theme';
import { DEFAULT_STATE, blockOf, currentSlideIdFor, labelFor, slidesFor, step, type StageState } from './bus';
import { talkFor } from './talks';
import type { LanInfo } from './deck-global';

const NO_LAN: LanInfo = { enabled: false, key: null, port: 0, urls: [], firewallNotice: null };

const HOLD_MARGIN = 13;

const UI = {
  bg: '#0B1220',
  panel: '#111B2E',
  panelSoft: '#16233A',
  line: 'rgba(255,255,255,0.10)',
  text: '#E8ECF3',
  dim: 'rgba(232,236,243,0.55)',
  accent: C.slonce,
  live: '#2ECC71',
};

/* --------------------------------------------------------------- podglad */

const Podglad: React.FC<{ slides: Slide[]; frame: number; width: number }> = ({
  slides,
  frame,
  width,
}) => {
  const duration = Math.max(1, totalDuration(slides));
  if (!slides.length) return null;
  return (
    <Thumbnail
      component={Deck}
      inputProps={{ slides }}
      durationInFrames={duration}
      frameToDisplay={Math.min(frame, duration - 1)}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      style={{ width, height: (width * 9) / 16, borderRadius: 10, overflow: 'hidden' }}
    />
  );
};

/* ---------------------------------------------------------------- pulpit */

const Pulpit: React.FC = () => {
  const [state, setState] = useState<StageState>(DEFAULT_STATE);
  const [lan, setLan] = useState<LanInfo>(NO_LAN);
  const [clock, setClock] = useState(() => new Date());

  // Stan żyje w main (electron/main.ts) — pulpit tylko odbiera i wysyła akcje przez IPC.
  useEffect(() => {
    window.deck.onState((p) => {
      setState(p.state);
      setLan(p.lan);
    });
    window.deck.requestState();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* ------------------------------------------------------------ akcje */

  const showSlide = useCallback((id: string) => window.deck.sendAction({ type: 'showSlide', id }), []);
  const showBlock = useCallback((id: string) => window.deck.sendAction({ type: 'showBlock', id }), []);
  const showTalk = useCallback((slideId: string) => window.deck.sendAction({ type: 'showTalk', slideId }), []);
  const endTalk = useCallback(() => window.deck.sendAction({ type: 'endTalk' }), []);
  const move = useCallback((delta: number) => window.deck.sendAction({ type: 'move', delta }), []);
  const toggleBlank = useCallback(() => window.deck.sendAction({ type: 'toggleBlank' }), []);
  const toggleLoop = useCallback(() => window.deck.sendAction({ type: 'toggleLoop' }), []);
  const replay = useCallback(() => window.deck.sendAction({ type: 'replay' }), []);

  const currentSlideId = currentSlideIdFor(state.source);

  /* ------------------------------------------------------- klawiatura */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          move(-1);
          break;
        case 'b':
        case 'B':
          toggleBlank();
          break;
        case 'l':
        case 'L':
          toggleLoop();
          break;
        case 'r':
        case 'R':
          replay();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, toggleBlank, toggleLoop, replay]);

  /* ------------------------------------------------------------ render */

  const onAir = useMemo(() => slidesFor(state.source), [state.source]);
  const onAirFrame =
    state.source.kind === 'slajd' ? Math.max(0, totalDuration(onAir) - HOLD_MARGIN) : 40;
  const liveTalkSlideId = state.source.kind === 'wystapienie' ? state.source.slideId : null;
  const liveTalk = liveTalkSlideId ? talkFor(liveTalkSlideId) : null;
  const liveTalkSlide = liveTalkSlideId ? deck.find((s) => s.id === liveTalkSlideId) : null;

  const nextId = step(currentSlideId, 1);
  const nextSlides = useMemo(() => slidesFor({ kind: 'slajd', id: nextId }), [nextId]);
  const currentSlide = deck.find((s) => s.id === currentSlideId);
  const currentBlock = blockOf(currentSlideId);

  return (
    <div
      style={{
        ...base,
        minHeight: '100vh',
        backgroundColor: UI.bg,
        color: UI.text,
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      {/* pasek gorny */}
      <header
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 20px',
          borderBottom: `1px solid ${UI.line}`,
          backgroundColor: UI.panel,
        }}
      >
        <strong style={{ fontSize: 16, letterSpacing: '0.02em' }}>Pulpit sceny</strong>
        <span style={{ fontSize: 13, color: UI.dim }}>{EVENT.editionLabel}</span>

        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: UI.live }} />
          <span style={{ fontSize: 13, color: UI.dim }}>scena podłączona</span>
        </span>

        <Btn onClick={toggleBlank} active={state.blank} danger>
          {state.blank ? 'Wróć z czerni (B)' : 'Czarny ekran (B)'}
        </Btn>
        <Btn onClick={toggleLoop} active={state.loop}>
          {state.loop ? 'Pętla (L)' : 'Zatrzymanie (L)'}
        </Btn>
        <Btn onClick={replay}>Od nowa (R)</Btn>

        <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginLeft: 8 }}>
          {clock.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </header>

      {lan.enabled && lan.urls.length ? (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: '8px 20px',
            fontSize: 12.5,
            color: UI.dim,
            borderBottom: `1px solid ${UI.line}`,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <strong style={{ color: UI.text }}>Widok prelegenta (telefon):</strong>{' '}
            {lan.urls.map((u) => `${u.base}/notes?k=${u.key}`).join('  ·  ')}
          </span>
          {lan.firewallNotice ? <span style={{ color: '#E7A23C' }}>{lan.firewallNotice}</span> : null}
        </div>
      ) : null}

      {/* lista bloków i slajdów */}
      <nav style={{ overflowY: 'auto', borderRight: `1px solid ${UI.line}`, padding: 12 }}>
        {KOMPOZYCJE.map((blok) => {
          const active = state.source.kind === 'blok' && state.source.id === blok.id;
          return (
            <section key={blok.id} style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => showBlock(blok.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${active ? UI.accent : UI.line}`,
                  backgroundColor: active ? 'rgba(243,114,28,0.14)' : UI.panelSoft,
                  color: UI.text,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {blok.id}
                <span style={{ float: 'right', color: UI.dim, fontWeight: 500 }}>{blok.time}</span>
                <div style={{ fontSize: 12, fontWeight: 500, color: UI.dim, marginTop: 4 }}>
                  {blok.loop ? 'pętla' : 'ręcznie'} · {blok.slides.length} slajdów
                </div>
              </button>

              <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
                {blok.slides.map((slide) => {
                  const on = state.source.kind === 'slajd' && state.source.id === slide.id;
                  const talkOn = state.source.kind === 'wystapienie' && state.source.slideId === slide.id;
                  const talk = talkFor(slide.id);
                  return (
                    <li key={slide.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                      <button
                        type="button"
                        onClick={() => showSlide(slide.id)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          padding: '7px 12px',
                          border: 'none',
                          borderLeft: `3px solid ${on || talkOn ? UI.accent : 'transparent'}`,
                          background: on ? 'rgba(243,114,28,0.10)' : 'transparent',
                          color: on || talkOn ? UI.text : UI.dim,
                          fontFamily: 'inherit',
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <span style={{ flex: 1 }}>{slide.id}</span>
                        <span style={{ opacity: 0.7 }}>{slide.kind}</span>
                        {slide.manual ? <span title="slajd ręczny">✋</span> : null}
                      </button>
                      {talk ? (
                        <button
                          type="button"
                          title="Uruchom prawdziwą prezentację (wideo/audio) tego prelegenta"
                          onClick={() => showTalk(slide.id)}
                          style={{
                            border: 'none',
                            borderLeft: `1px solid ${UI.line}`,
                            background: talkOn ? 'rgba(243,114,28,0.22)' : 'transparent',
                            color: talkOn ? UI.accent : UI.dim,
                            cursor: 'pointer',
                            padding: '0 10px',
                            fontSize: 14,
                          }}
                        >
                          🎬
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>

      {/* podglądy */}
      <main style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <Label color={UI.live}>Na ekranie</Label>
            <div style={{ position: 'relative' }}>
              {state.source.kind === 'wystapienie' ? (
                <div
                  style={{
                    width: 760,
                    height: (760 * 9) / 16,
                    borderRadius: 10,
                    background: '#000',
                    border: `2px solid ${liveTalk ? UI.accent : '#E74C3C'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    color: UI.text,
                  }}
                >
                  <div style={{ fontSize: 28 }}>🎬</div>
                  <div style={{ fontWeight: 700 }}>
                    {liveTalk ? 'Trwa prawdziwa prezentacja' : 'Brak pliku — pokazuje się karta tytułowa'}
                  </div>
                  {liveTalkSlide && 'name' in liveTalkSlide ? (
                    <div style={{ fontSize: 13, color: UI.dim }}>{liveTalkSlide.name}</div>
                  ) : null}
                  <Btn onClick={endTalk}>Zakończ prezentację</Btn>
                </div>
              ) : (
                <Podglad slides={onAir} frame={onAirFrame} width={760} />
              )}
              {state.blank ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.86)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                  }}
                >
                  CZARNY EKRAN
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: UI.dim }}>
              {labelFor(state.source)}
              {currentBlock ? ` · ${currentBlock.id}` : ''}
            </div>
          </div>

          <div>
            <Label color={UI.dim}>Następny</Label>
            <Podglad slides={nextSlides} frame={Math.max(0, totalDuration(nextSlides) - HOLD_MARGIN)} width={360} />
            <div style={{ marginTop: 8, fontSize: 13, color: UI.dim }}>{nextId}</div>
          </div>
        </div>

        {currentSlide?.note ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              backgroundColor: UI.panelSoft,
              border: `1px solid ${UI.line}`,
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.18em', color: UI.accent, marginBottom: 6 }}>
              NOTATKA OPERATORA
            </div>
            {currentSlide.note}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => move(-1)}>← Poprzedni</Btn>
          <Btn onClick={() => move(1)} active>
            Następny →
          </Btn>
        </div>

        <div style={{ fontSize: 12.5, color: UI.dim, lineHeight: 1.7 }}>
          <strong style={{ color: UI.text }}>Skróty:</strong> → / spacja następny · ← poprzedni ·{' '}
          <strong style={{ color: UI.text }}>B</strong> czarny ekran ·{' '}
          <strong style={{ color: UI.text }}>L</strong> pętla / zatrzymanie ·{' '}
          <strong style={{ color: UI.text }}>R</strong> odtwórz od nowa
        </div>
      </main>
    </div>
  );
};

/* ----------------------------------------------------------- drobiazgi UI */

const Btn: React.FC<{
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, active, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '9px 14px',
      borderRadius: 8,
      border: `1px solid ${active ? (danger ? '#E74C3C' : UI.accent) : UI.line}`,
      backgroundColor: active ? (danger ? 'rgba(231,76,60,0.16)' : 'rgba(243,114,28,0.16)') : UI.panelSoft,
      color: UI.text,
      fontFamily: 'inherit',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

const Label: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color,
      marginBottom: 8,
      fontWeight: 700,
    }}
  >
    {children}
  </div>
);

createRoot(document.getElementById('root')!).render(<Pulpit />);

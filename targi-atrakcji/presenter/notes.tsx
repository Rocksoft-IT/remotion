/**
 * Presenter Notes — read-only, phone-friendly view of "what's now / what's next". Served over
 * the LAN (electron/server.js, Phase 3), not spawned as a local Electron window: the only person
 * who reads this is the presenter on stage with their own phone, not the operator.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EVENT } from '../slides';
import { C, base } from '../src/theme';
import { DEFAULT_STATE, currentSlideIdFor, type StageState } from './bus';
import { AGENDA, agendaAfter, agendaAt, blockLabelFor, type AgendaItem } from './agenda';

const UI = {
  bg: C.granat,
  panel: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.14)',
  text: C.mgla,
  dim: 'rgba(236,239,243,0.62)',
  accent: C.slonce,
};

const Row: React.FC<{ item: AgendaItem; current: boolean }> = ({ item, current }) => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 8,
      background: current ? 'rgba(243,114,28,0.16)' : 'transparent',
      borderLeft: `3px solid ${current ? UI.accent : 'transparent'}`,
    }}
  >
    <div style={{ width: 52, fontVariantNumeric: 'tabular-nums', color: current ? UI.accent : UI.dim, fontWeight: 700 }}>
      {item.time}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: UI.text }}>{item.title}</div>
      {item.presenter ? <div style={{ fontSize: 13, color: UI.dim, marginTop: 2 }}>{item.presenter}</div> : null}
    </div>
  </div>
);

const Notes: React.FC = () => {
  const [state, setState] = useState<StageState>(DEFAULT_STATE);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    window.deck.onState((p) => setState(p.state));
    window.deck.requestState();
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const currentSlideId = currentSlideIdFor(state.source);
  const now = useMemo(() => agendaAt(currentSlideId), [currentSlideId]);
  const next = useMemo(() => agendaAfter(currentSlideId), [currentSlideId]);
  const nowLabel = now?.title ?? blockLabelFor(currentSlideId) ?? '—';
  const nowPresenter = now?.presenter;

  return (
    <div style={{ ...base, minHeight: '100vh', background: UI.bg, color: UI.text }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: `1px solid ${UI.line}`,
        }}
      >
        <strong style={{ fontSize: 14, letterSpacing: '0.04em' }}>{EVENT.editionLabel}</strong>
        <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {clock.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </header>

      <main style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {state.blank ? (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', fontSize: 13, color: UI.dim }}>
            Ekran sceny jest wygaszony (czarny ekran) — to normalne przy wejściu na scenę.
          </div>
        ) : null}

        <section>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI.accent, fontWeight: 700, marginBottom: 8 }}>
            Teraz na scenie
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15 }}>{nowLabel}</div>
          {nowPresenter ? <div style={{ fontSize: 15, color: UI.dim, marginTop: 6 }}>{nowPresenter}</div> : null}
        </section>

        {next ? (
          <section>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI.dim, fontWeight: 700, marginBottom: 8 }}>
              Zaraz na scenie · {next.time}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{next.title}</div>
            {next.presenter ? <div style={{ fontSize: 14, color: UI.dim, marginTop: 4 }}>{next.presenter}</div> : null}
          </section>
        ) : null}

        <section>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI.dim, fontWeight: 700, marginBottom: 8 }}>
            Program dnia
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: UI.panel, borderRadius: 10, padding: 6 }}>
            {AGENDA.map((item) => (
              <Row key={item.slideId} item={item} current={now?.slideId === item.slideId} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<Notes />);

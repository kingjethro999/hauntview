'use client';

import React, { useEffect, useState } from 'react';
import { AVAILABLE_PROFILES, RITE_CATEGORIES, ProfileInfo, RiteCategory } from './rites';
import { CandleIndicator, CandleStatus } from './CandleIndicator';

/**
 * The séance table — HauntView's launcher.
 *
 *   · The address line names the house (URL) to haunt.
 *   · Every rite (failure condition) is a candle around the table, grouped
 *     into arcs by category. A lit candle will run.
 *   · The planchette in the centre is the Begin control. It turns toward
 *     whichever candle you're considering and, during a run, points at the
 *     rite in progress while candles light one by one around the ring.
 *   · The ledger beneath is the same selection as a plain list, so the ring
 *     never has to be decoded to be used.
 */

export interface SeanceTableProps {
  onStartTest: (url: string, profiles: string[]) => Promise<void>;
  isRunning: boolean;
}

const PRESETS = [
  { label: 'localhost:3000', url: 'http://localhost:3000' },
  { label: 'localhost:8080', url: 'http://localhost:8080' },
  { label: 'example.com', url: 'https://example.com' },
];

const isValidUrl = (val: string) => {
  try {
    const u = new URL(val.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

type Slot = { rite: ProfileInfo; angle: number };
type Arc = { id: RiteCategory; label: string; angle: number };

/** Lay rites around the circle by category, leaving one empty slot between arcs. */
function layoutRing() {
  const groups = RITE_CATEGORIES.map((c) => ({
    ...c,
    rites: AVAILABLE_PROFILES.filter((p) => p.category === c.id),
  })).filter((g) => g.rites.length);
  const total = AVAILABLE_PROFILES.length + groups.length;
  const step = 360 / total;
  const slots: Slot[] = [];
  const arcs: Arc[] = [];
  let s = 0.5; // offset so the gap sits at the very top
  for (const g of groups) {
    const start = s;
    for (const rite of g.rites) {
      slots.push({ rite, angle: s * step });
      s += 1;
    }
    arcs.push({ id: g.id, label: g.label, angle: ((start + s - 1) / 2) * step });
    s += 1;
  }
  return { slots, arcs, groups };
}

const RING = layoutRing();

const LETTERS =
  'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z · 1 2 3 4 5 6 7 8 9 0 · YES · NO ·';

export function SeanceTable({ onStartTest, isRunning }: SeanceTableProps) {
  const { slots, arcs, groups } = RING;
  const [url, setUrl] = useState('http://localhost:3000');
  const [selected, setSelected] = useState<string[]>(AVAILABLE_PROFILES.map((p) => p.id));
  const [hot, setHot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const valid = isValidUrl(url);
  const selectedSet = new Set(selected);
  const runOrder = slots.filter((s) => selectedSet.has(s.rite.id)).map((s) => s.rite.id);

  // Estimated progress while the server works (~2.5s per rite, capped at 95%)
  useEffect(() => {
    if (!isRunning) return;
    const started = Date.now();
    const id = setInterval(() => setTick(Date.now() - started), 400);
    return () => {
      clearInterval(id);
      setTick(0);
    };
  }, [isRunning]);

  const total = runOrder.length || 1;
  const estimate = Math.max(8000, total * 2500);
  const ratio = isRunning ? Math.min(0.95, tick / estimate) : 0;
  const current = isRunning ? Math.min(total - 1, Math.floor(ratio * total)) : -1;
  const currentId = isRunning ? runOrder[current] : null;
  const pct = Math.round(ratio * 100);

  const angleOf = (id: string | null) => slots.find((s) => s.rite.id === id)?.angle;
  const point = (isRunning ? angleOf(currentId) : angleOf(hot)) ?? 0;

  const statusOf = (id: string): CandleStatus => {
    if (!isRunning) return selectedSet.has(id) ? 'lit' : 'unlit';
    if (!selectedSet.has(id)) return 'skipped';
    const i = runOrder.indexOf(id);
    if (i < current) return 'ok';
    if (i === current) return 'running';
    return 'unlit';
  };

  const toggle = (id: string) => {
    setError(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };
  const setGroup = (ids: string[], on: boolean) =>
    setSelected((prev) =>
      on ? Array.from(new Set([...prev, ...ids])) : prev.filter((p) => !ids.includes(p))
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    const trimmed = url.trim();
    if (!trimmed) return setError('Name a house first — enter the URL you want to test.');
    if (!isValidUrl(trimmed))
      return setError('That address won’t open. Include the protocol, like https://example.com.');
    if (!selected.length) return setError('Light at least one candle — choose a rite to run.');
    setError(null);
    try {
      await onStartTest(trimmed, runOrder);
    } catch (err) {
      setError(
        err instanceof Error
          ? `The séance was interrupted: ${err.message}`
          : 'The séance was interrupted. Check the URL is reachable and try again.'
      );
    }
  };

  const verb = isRunning
    ? `${pct}%`
    : !valid
      ? 'Name a house'
      : selected.length
        ? 'Begin'
        : 'Light a candle';
  const sub = isRunning
    ? `rite ${current + 1} of ${total}`
    : `${selected.length} ${selected.length === 1 ? 'rite' : 'rites'}`;

  return (
    <form onSubmit={submit} className="space-y-10 sm:space-y-14" noValidate>
      {/* ── The house ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="hv-address">
          <label htmlFor="target-url" className="hv-address__label">
            The house at
          </label>
          <input
            id="target-url"
            className="hv-address__input"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="https://your-site.com"
            value={url}
            disabled={isRunning}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            aria-invalid={url.length > 0 && !valid}
            aria-describedby="url-hint"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="hv-presets" role="group" aria-label="Quick addresses">
            <span className="hv-mono-label mr-1" id="url-hint">
              {url.length === 0
                ? 'Enter a URL'
                : valid
                  ? 'Address looks right'
                  : 'Include http:// or https://'}
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.url}
                type="button"
                className="hv-preset"
                aria-pressed={url === p.url}
                disabled={isRunning}
                onClick={() => {
                  setUrl(p.url);
                  setError(null);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-[#ffb3ad]">
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </p>
      )}

      {/* ── The table ───────────────────────────────────────────── */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14 items-start">
        <div className="sm:px-10 lg:sticky lg:top-[calc(var(--hv-topbar)+1.5rem)]">
          <div
            className={`hv-table ${isRunning ? 'is-running' : ''}`}
            role="group"
            aria-label="Rites around the séance table"
          >
            <div className="hv-table__surface" aria-hidden="true" />
            <svg className="hv-table__letters" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="hv-letter-ring" d="M100 100m-86 0a86 86 0 1 1 172 0a86 86 0 1 1-172 0" />
              </defs>
              <text
                fill="var(--hv-ash)"
                opacity="0.45"
                fontFamily="var(--hv-font-display)"
                fontSize="9.4"
                letterSpacing="2.2"
              >
                <textPath href="#hv-letter-ring">{LETTERS}</textPath>
              </text>
            </svg>

            {arcs.map((a) => (
              <span
                key={a.id}
                className="hv-arc-label"
                style={{ '--a': `${a.angle}deg` } as React.CSSProperties}
                aria-hidden="true"
              >
                {a.label}
              </span>
            ))}

            {slots.map(({ rite, angle }) => {
              const on = selectedSet.has(rite.id);
              return (
                <span
                  key={rite.id}
                  className="hv-candle-slot"
                  style={{ '--a': `${angle}deg` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className={`hv-candle-btn ${hot === rite.id ? 'is-hot' : ''}`}
                    aria-pressed={on}
                    aria-label={`${rite.name}: ${rite.description}`}
                    disabled={isRunning}
                    onClick={() => toggle(rite.id)}
                    onPointerEnter={() => setHot(rite.id)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(rite.id)}
                    onBlur={() => setHot(null)}
                  >
                    <CandleIndicator status={statusOf(rite.id)} size="md" decorative />
                    <span className="hv-candle-tip" aria-hidden="true">
                      {rite.name}
                    </span>
                  </button>
                </span>
              );
            })}

            <button
              type="submit"
              className="hv-planchette"
              disabled={isRunning || !valid || !selected.length}
              aria-busy={isRunning || undefined}
              aria-describedby="seance-status"
              style={{ '--point': `${point}deg` } as React.CSSProperties}
            >
              <span className="hv-planchette__body" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <path
                    d="M50 -6 C70 8 92 30 92 58 C92 82 72 96 50 96 C28 96 8 82 8 58 C8 30 30 8 50 -6Z"
                    fill="url(#hv-planchette-wood)"
                    stroke="rgba(255,190,150,0.55)"
                    strokeWidth="1.2"
                  />
                  <circle
                    className="hv-planchette__lens"
                    cx="50"
                    cy="9"
                    r="5.5"
                    fill="var(--hv-void)"
                    stroke="var(--hv-ember)"
                    strokeWidth="1.4"
                  />
                  <defs>
                    <radialGradient id="hv-planchette-wood" cx="50%" cy="35%" r="70%">
                      <stop offset="0" stopColor="#2a2233" />
                      <stop offset="1" stopColor="#120f19" />
                    </radialGradient>
                  </defs>
                </svg>
              </span>
              <span className="hv-planchette__label">
                <span className="hv-planchette__verb">{verb}</span>
                <span className="hv-planchette__count">{sub}</span>
              </span>
            </button>
          </div>

          <p id="seance-status" className="hv-status-line mt-6" aria-live="polite">
            {isRunning ? (
              <>
                <span>
                  Now: <strong>{AVAILABLE_PROFILES.find((p) => p.id === currentId)?.name}</strong>
                </span>
                <span>
                  {current} of {total} done
                </span>
              </>
            ) : (
              <>
                <span>
                  <strong>{selected.length}</strong> of {AVAILABLE_PROFILES.length} candles lit
                </span>
                <span>~{Math.max(10, Math.round((selected.length * 2.5) / 5) * 5)}s</span>
              </>
            )}
          </p>
        </div>

        {/* ── The ledger ──────────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="hv-eyebrow">The ledger</p>
              <p className="mt-2 text-[var(--hv-bone-dim)] max-w-sm">
                Each candle is a failure condition run in a real browser. Light the ones you want.
              </p>
            </div>
            <button
              type="button"
              className="hv-btn hv-btn--outline hv-btn--sm lg:hidden"
              aria-expanded={ledgerOpen}
              aria-controls="hv-ledger"
              onClick={() => setLedgerOpen((o) => !o)}
            >
              {ledgerOpen ? 'Hide list' : 'Show list'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="hv-btn hv-btn--ghost hv-btn--sm"
              disabled={isRunning || selected.length === AVAILABLE_PROFILES.length}
              onClick={() => setSelected(AVAILABLE_PROFILES.map((p) => p.id))}
            >
              Light every candle
            </button>
            <button
              type="button"
              className="hv-btn hv-btn--ghost hv-btn--sm"
              disabled={isRunning || selected.length === 0}
              onClick={() => setSelected([])}
            >
              Snuff them all
            </button>
          </div>

          <div id="hv-ledger" className={`hv-ledger ${ledgerOpen ? '' : 'max-lg:hidden'}`}>
            {groups.map((g) => {
              const ids = g.rites.map((r) => r.id);
              const count = ids.filter((id) => selectedSet.has(id)).length;
              const all = count === ids.length;
              return (
                <section key={g.id} className="hv-ledger__group" aria-label={g.label}>
                  <header>
                    <span className="hv-mono-label">
                      {g.label}{' '}
                      <span className="text-[var(--hv-bone-dim)]">
                        {count}/{ids.length}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="hv-btn hv-btn--ghost hv-btn--sm"
                      disabled={isRunning}
                      onClick={() => setGroup(ids, !all)}
                      aria-label={`${all ? 'Snuff' : 'Light'} all ${g.label} rites`}
                    >
                      {all ? 'Snuff' : 'Light all'}
                    </button>
                  </header>
                  <div className="hv-ledger__items">
                    {g.rites.map((rite) => (
                      <button
                        key={rite.id}
                        type="button"
                        className={`hv-ledger__item ${hot === rite.id ? 'is-hot' : ''}`}
                        aria-pressed={selectedSet.has(rite.id)}
                        disabled={isRunning}
                        onClick={() => toggle(rite.id)}
                        onPointerEnter={() => setHot(rite.id)}
                        onPointerLeave={() => setHot(null)}
                      >
                        <CandleIndicator status={statusOf(rite.id)} size="sm" decorative />
                        <span className="min-w-0">
                          {rite.name}
                          <span className="hv-ledger__desc">{rite.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}

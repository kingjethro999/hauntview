'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HAUNTVIEW_DOCS_MARKDOWN } from './docs-markdown';
import { Blocks, Inline, parseManual } from './scroll-markdown';
import { VERSION } from '../../src/version';
import { Container } from '../components/layout/Container';
import { CandleIndicator, CandleStatus } from '../components/features/CandleIndicator';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';

/**
 * The Scroll — HauntView's manual, rendered from the same Markdown that the
 * "Copy as Markdown" button exports. Each chapter is a candle in the rail:
 * chapters you've read burn steady, the one you're reading flickers, the rest
 * wait unlit. On phones the rail becomes a chapter strip under the top bar.
 */

const CHAPTERS = parseManual(HAUNTVIEW_DOCS_MARKDOWN);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const roman = (n: string) => ROMAN[Number(n) - 1] ?? n;

export default function ScrollPage() {
  const [active, setActive] = useState(CHAPTERS[0]?.id ?? '');
  const [copied, setCopied] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  // Track which chapter is being read: the last one whose top has passed 35% of the viewport
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current = CHAPTERS[0]?.id ?? '';
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) current = c.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Keep the active chip visible in the mobile strip
  useEffect(() => {
    const chip = stripRef.current?.querySelector<HTMLElement>(`[data-chapter="${active}"]`);
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const activeIndex = CHAPTERS.findIndex((c) => c.id === active);
  const statusOf = (i: number): CandleStatus =>
    i < activeIndex ? 'ok' : i === activeIndex ? 'running' : 'unlit';

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(HAUNTVIEW_DOCS_MARKDOWN.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="hv-scroll pb-24">
      <FloatingDraggableGhost />

      {/* ── Title ─────────────────────────────────────────────── */}
      <Container size="lg" className="pt-10 sm:pt-16 pb-10 sm:pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div className="space-y-5">
            <p className="hv-eyebrow hv-rise">The scroll · v{VERSION}</p>
            <h1 className="hv-display hv-rise" style={{ '--i': 1 } as React.CSSProperties}>
              Read the <em>rites.</em>
            </h1>
          </div>
          <div className="space-y-5 hv-rise lg:pb-3" style={{ '--i': 2 } as React.CSSProperties}>
            <p className="hv-lede">
              How to run HauntView from the terminal, wire it into Kiro or any MCP agent, and what
              each of the rites actually does.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="hv-btn hv-btn--primary" onClick={copyMarkdown}>
                <span aria-live="polite">
                  {copied ? 'Copied to clipboard' : 'Copy as Markdown'}
                </span>
              </button>
              <a
                className="hv-btn hv-btn--outline"
                href="https://github.com/kingjethro999/hauntview"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <a
                className="hv-btn hv-btn--ghost"
                href="https://www.npmjs.com/package/hauntview"
                target="_blank"
                rel="noopener noreferrer"
              >
                npm <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </Container>

      {/* ── Mobile chapter strip ─────────────────────────────── */}
      <nav aria-label="Chapters" className="hv-scroll__strip lg:hidden">
        <div ref={stripRef} className="hv-scroll__strip-inner">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-chapter={c.id}
              aria-current={active === c.id ? 'location' : undefined}
            >
              <span className="font-[family-name:var(--hv-font-display)] italic">
                {roman(c.num)}
              </span>
              <Inline text={c.title.replace(/\s*\(.*\)$/, '')} />
            </a>
          ))}
        </div>
      </nav>

      <Container size="lg">
        <div className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-20">
          {/* ── Chapter rail ─────────────────────────────────── */}
          <nav aria-label="Chapters" className="hidden lg:block">
            <div className="hv-scroll__rail">
              <p className="hv-mono-label mb-4">Chapters</p>
              <ol>
                {CHAPTERS.map((c, i) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} aria-current={active === c.id ? 'location' : undefined}>
                      <CandleIndicator status={statusOf(i)} size="sm" decorative />
                      <span>
                        <span className="hv-scroll__rail-num">{roman(c.num)}</span>
                        <Inline text={c.title.replace(/\s*\(.*\)$/, '')} />
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              <p className="hv-mono-label mt-6 !normal-case !tracking-[0.06em]">
                {activeIndex + 1} of {CHAPTERS.length} · candles mark what you’ve read
              </p>
            </div>
          </nav>

          {/* ── The manuscript ───────────────────────────────── */}
          <article className="hv-scroll__body min-w-0">
            {CHAPTERS.map((c) => (
              <section
                key={c.id}
                id={c.id}
                aria-labelledby={`${c.id}-title`}
                className="hv-scroll__chapter"
              >
                <header className="hv-scroll__chapter-head">
                  <span className="hv-scroll__numeral" aria-hidden="true">
                    {roman(c.num)}
                  </span>
                  <h2 id={`${c.id}-title`} className="hv-h2">
                    <Inline text={c.title} />
                  </h2>
                </header>
                <Blocks blocks={c.blocks} />
              </section>
            ))}
          </article>
        </div>
      </Container>
    </div>
  );
}

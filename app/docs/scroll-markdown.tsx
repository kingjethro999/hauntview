'use client';

import React, { useState } from 'react';

/**
 * A deliberately small Markdown renderer for the manual. It understands only
 * what docs-markdown.ts uses — headings, fenced code, tables, lists,
 * blockquotes, inline code, bold and links — so the page and the
 * "Copy as Markdown" export come from one source and can never drift.
 */

export type Block =
  | { kind: 'h3' | 'h4'; text: string; id: string }
  | { kind: 'p'; text: string }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'quote'; text: string };

export type Chapter = { id: string; num: string; title: string; blocks: Block[] };

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

function parseBlocks(lines: string[], chapterId: string): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t || t === '---') {
      i++;
      continue;
    }
    const fence = t.match(/^```(\w*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push({ kind: 'code', lang: fence[1] || 'text', code: body.join('\n') });
      continue;
    }
    const h = t.match(/^(#{3,4})\s+(.*)$/);
    if (h) {
      const text = h[2].replace(/:$/, '');
      blocks.push({
        kind: h[1].length === 3 ? 'h3' : 'h4',
        text,
        id: `${chapterId}--${slug(text)}`,
      });
      i++;
      continue;
    }
    if (t.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      const [head, , ...body] = rows; // second row is the :--- divider
      blocks.push({ kind: 'table', head, rows: body });
      continue;
    }
    if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) {
      const ordered = /^\d+\.\s/.test(t);
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = ordered ? l.match(/^\d+\.\s+(.*)$/) : l.match(/^[-*]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ kind: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (t.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>'))
        q.push(lines[i++].trim().replace(/^>\s?/, ''));
      blocks.push({ kind: 'quote', text: q.join(' ') });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(```|#{2,4}\s|\||[-*]\s|\d+\.\s|>|---$)/.test(lines[i].trim())
    )
      para.push(lines[i++].trim());
    blocks.push({ kind: 'p', text: para.join(' ') });
  }
  return blocks;
}

/** Split the manual into chapters at each `## N. Title` heading. */
export function parseManual(md: string): Chapter[] {
  const lines = md.split('\n');
  const chapters: Chapter[] = [];
  let current: { head: string; lines: string[] } | null = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      if (current) chapters.push(toChapter(current.head, current.lines));
      current = { head: m[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) chapters.push(toChapter(current.head, current.lines));
  return chapters;
}

function toChapter(head: string, lines: string[]): Chapter {
  const m = head.match(/^(\d+)\.\s+(.*)$/);
  const num = m ? m[1] : '';
  const title = m ? m[2] : head;
  const id = slug(title.replace(/\(.*?\)/g, '')) || `chapter-${num}`;
  return { id, num, title, blocks: parseBlocks(lines, id) };
}

/** Inline: `code`, **bold**, [label](url), bare https URLs. */
export function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) {
      out.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('**')) {
      out.push(
        <strong key={k++}>
          <Inline text={tok.slice(2, -2)} />
        </strong>
      );
    } else if (tok.startsWith('[')) {
      const [, label, href] = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      out.push(<ExternalLink key={k++} href={href} label={label} />);
    } else {
      out.push(<ExternalLink key={k++} href={tok} label={tok.replace(/^https?:\/\//, '')} />);
    }
    last = m.index! + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hv-scroll__link">
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A fenced code block — an incantation you can copy. */
export function Incantation({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };
  return (
    <figure className="hv-incantation">
      <figcaption>
        <span>{lang === 'bash' ? 'terminal' : lang}</span>
        <button type="button" onClick={copy} className="hv-incantation__copy">
          <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          <span className="sr-only"> {lang} snippet</span>
        </button>
      </figcaption>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h3':
            return (
              <h3 key={i} id={b.id} className="hv-scroll__h3">
                <Inline text={b.text} />
              </h3>
            );
          case 'h4':
            return (
              <h4 key={i} id={b.id} className="hv-scroll__h4">
                <Inline text={b.text} />
              </h4>
            );
          case 'p':
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
          case 'quote':
            return (
              <blockquote key={i}>
                <Inline text={b.text} />
              </blockquote>
            );
          case 'code':
            return <Incantation key={i} code={b.code} lang={b.lang} />;
          case 'ul':
          case 'ol': {
            const List = b.kind;
            return (
              <List key={i} className={`hv-scroll__${b.kind}`}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </List>
            );
          }
          case 'table':
            return (
              <div
                key={i}
                className="hv-scroll__table"
                role="region"
                aria-label={`Table: ${b.head.join(', ')}`}
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} scope="col">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}

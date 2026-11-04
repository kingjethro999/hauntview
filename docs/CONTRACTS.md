# HauntView — Contracts Reference

Auto-generated from `src/types/contracts.ts`. Do not edit by hand.

---

## RiteId

All valid rite identifiers. `'full'` is a composite that expands to all atomic rites at runtime.

```ts
type RiteId =
  | 'full'
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'image-failure'
  | 'font-failure'
  | 'js-disabled'
  | 'reduced-motion'
  | 'console-errors'
  | 'offline'
  | 'accessibility'
  | 'broken-links'
  | 'network-resilience'
  | 'performance'
  | 'security-hygiene'
  | 'form-resilience';

type AtomicRiteId = Exclude<RiteId, 'full'>;
```

---

## Severity

```ts
type Severity = 'info' | 'warning' | 'serious';
```

Policy:

| Severity  | Meaning                                                |
| --------- | ------------------------------------------------------ |
| `info`    | Observation worth noting; no immediate action required |
| `warning` | Issue that should be fixed before release              |
| `serious` | Blocks users — must be fixed                           |

**`heuristic` confidence may never produce `serious` severity.**

---

## Confidence

```ts
type Confidence = 'observed' | 'measured' | 'heuristic';
```

| Confidence  | Meaning                                          |
| ----------- | ------------------------------------------------ |
| `observed`  | Boolean fact — present or absent                 |
| `measured`  | Numeric fact compared against a threshold        |
| `heuristic` | Inference from indirect signals; lower certainty |

---

## Evidence

Every `CanonicalFinding` carries at least one evidence item. The runtime guard in `buildFinding` throws if `evidence` is empty.

```ts
type Evidence =
  | { kind: 'screenshot'; captureId: string }
  | { kind: 'request'; url: string; method: string; status?: number; failure?: string }
  | { kind: 'console'; level: string; text: UntrustedText }
  | { kind: 'dom'; selector: string; snippet: UntrustedText }
  | { kind: 'header'; name: string; value?: UntrustedText; expected?: string }
  | { kind: 'metric'; name: string; value: number; unit: string; threshold?: number }
  | { kind: 'axe'; ruleId: string; impact: string; nodes: number; helpUrl: string };
```

---

## UntrustedText

Any string originating from a tested page must be wrapped before reaching the UI, MCP response, or a report.

```ts
interface UntrustedText {
  untrusted: true;
  text: string; // truncated to 300 chars, control characters stripped
}
```

Sanitization is performed by `sanitizeUntrusted(raw: string): UntrustedText` in `contracts.ts`:

- Strips control characters `\x00–\x08`, `\x0B`, `\x0C`, `\x0E–\x1F`, `\x7F`
- Truncates to 300 characters

---

## CanonicalFinding

```ts
interface CanonicalFinding {
  /** sha256(ruleId + rite + normalizedLocator).slice(0, 16) */
  id: string;
  ruleId: string;
  rite: AtomicRiteId;
  severity: Severity;
  confidence: Confidence;
  /** Plain text, ≤ 90 characters, no lore terms */
  title: string;
  /** Plain, 1–2 sentences */
  summary: string;
  where?: { selector?: string; url?: string; bbox?: Rect };
  /** Always non-empty — enforced by buildFinding() */
  evidence: [Evidence, ...Evidence[]];
  investigate: string[];
}
```

Use `buildFinding(params)` from `src/types/finding-utils.ts` to construct findings. It:

1. Validates `evidence` is non-empty
2. Validates `severity`/`confidence` combination
3. Validates `title` ≤ 90 characters
4. Derives a stable `id` via `sha256(ruleId + rite + normalizedLocator).slice(0, 16)`

---

## RiteResult

```ts
interface RiteResult {
  rite: AtomicRiteId;
  status: 'ok' | 'findings' | 'skipped' | 'error';
  skippedReason?: string;
  captures: Capture[];
  findings: CanonicalFinding[];
  durationMs: number;
  error?: { code: string; message: string };
}
```

---

## HauntRun

Top-level run record stored in SQLite and returned by the MCP `haunt_run_rites` tool.

```ts
interface HauntRun {
  id: string; // ULID
  targetUrl: string;
  requestedRites: RiteId[];
  expandedRites: RiteId[];
  status: 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
  startedAt: string;
  finishedAt?: string;
  engine: { version: string; browser: { name: 'chromium'; version: string } };
  baselines: Capture[];
  rites: RiteResult[];
  failure?: { code: string; message: string; hint: string };
}
```

---

## API Response Shape

All HTTP endpoints and MCP tool responses use a discriminated union:

```ts
type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string; hint: string } };
```

Errors never expose internal stack traces. `hint` contains actionable guidance.

---

## Severity / Confidence Matrix (per steering rules)

| Situation                              | Severity                              | Confidence  |
| -------------------------------------- | ------------------------------------- | ----------- |
| Document fails to load / 5xx           | `serious`                             | `observed`  |
| Uncaught page error during load        | `warning`                             | `observed`  |
| Text drops >80% under condition        | `serious`                             | `measured`  |
| Horizontal overflow at viewport        | `warning`                             | `measured`  |
| axe critical/serious impact            | `serious`                             | `measured`  |
| axe moderate impact                    | `warning`                             | `measured`  |
| axe minor impact                       | `info`                                | `measured`  |
| Same-origin link 404/410               | `warning`                             | `observed`  |
| Link returns 401/403/429               | `info`                                | `observed`  |
| Missing recommended security header    | `info` or `warning` — never `serious` | `observed`  |
| LCP/CLS beyond "poor" threshold        | `warning`                             | `measured`  |
| No offline fallback, no service worker | `info`                                | `observed`  |
| Images missing alt attribute           | `warning`                             | `observed`  |
| Images missing width/height            | `info`                                | `heuristic` |
| Font fallback layout shift             | `warning`                             | `measured`  |
| JS disabled, no noscript fallback      | `warning`                             | `observed`  |
| JS disabled, noscript present          | `info`                                | `observed`  |
| Animations under reduced-motion        | `warning`                             | `observed`  |
| API failure causes errors/blank page   | `warning`                             | `observed`  |
| Form submits without validation        | `warning`                             | `heuristic` |
| Form validation works                  | `info`                                | `heuristic` |

**Invariant: `heuristic` confidence may NOT produce `serious` severity.**

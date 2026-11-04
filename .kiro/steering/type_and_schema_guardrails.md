---
inclusion: always
---

# Type & Schema Guardrails — HauntView

These rules govern TypeScript strictness, Zod schema usage, and JSON output contracts.
Kiro **must** apply these rules to every file it generates or modifies.

## TypeScript Compiler Flags (non-negotiable)

The following flags are active in `tsconfig.json` and must remain enabled:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

- **`noUncheckedIndexedAccess`** — array and object index access returns
  `T | undefined`. Always narrow before using: `arr[0] ?? defaultValue`.
- **`exactOptionalPropertyTypes`** — do not assign `undefined` to optional
  properties; omit the property instead.
- Never use `any`. Use `unknown` + type guards or Zod `.parse()`.
- Never use non-null assertion (`!`) unless a comment proves it is safe.

## Zod — Single Source of Truth

All shared data shapes are Zod schemas in `src/core/contracts/` (or
`packages/core/src/contracts/`). TypeScript types are derived:

```ts
// Good
export const HauntRunSchema = z.object({ ... });
export type HauntRun = z.infer<typeof HauntRunSchema>;

// Bad — duplicate manual interface
export interface HauntRun { ... } // ← never do this for contract types
```

Zod schemas are also exported as JSON Schema via `zodToJsonSchema` for the
`docs/CONTRACTS.md` file. **After any contract change, regenerate CONTRACTS.md.**

## Evidence Contract

`Finding.evidence` must never be empty. Kiro must generate code that enforces this:

```ts
// Core runtime guard (already in src/core/findings.ts or equivalent)
if (finding.evidence.length === 0) {
  throw new Error(`Finding ${finding.id} has no evidence — refused`);
}
```

## UntrustedText Shape

```ts
interface UntrustedText {
  untrusted: true;
  text: string; // truncated to 300 chars, control chars stripped
}
```

When generating code that handles page-originated strings:

1. Strip control characters: `str.replace(/[\x00-\x1F\x7F]/g, '')`
2. Truncate: `str.slice(0, 300)`
3. Wrap: `{ untrusted: true, text: cleaned }`

Never interpolate an `UntrustedText` value directly into HTML, SQL, or shell commands.

## Severity & Confidence Policy

| Situation                                              | Severity                              | Confidence |
| ------------------------------------------------------ | ------------------------------------- | ---------- |
| Document fails to load / returns 5xx                   | `serious`                             | `observed` |
| Uncaught page error during load                        | `warning`                             | `observed` |
| Text drops >80% under condition (baseline had content) | `serious`                             | `measured` |
| Horizontal overflow at a viewport                      | `warning`                             | `measured` |
| axe critical/serious impact                            | `serious`                             | `measured` |
| axe moderate impact                                    | `warning`                             | `measured` |
| axe minor impact                                       | `info`                                | `measured` |
| Same-origin link returns 404/410                       | `warning`                             | `observed` |
| Link returns 401/403/429                               | `info`                                | `observed` |
| Missing recommended security header                    | `info` or `warning` — never `serious` | `observed` |
| LCP/CLS beyond "poor" threshold                        | `warning`                             | `measured` |
| No offline fallback, no service worker                 | `info`                                | `observed` |

Rule: **`heuristic` confidence may NOT produce `serious` severity.**

## API Response Shapes

All API endpoints and MCP tool responses **must** use a discriminated union:

```ts
type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string; hint: string } };
```

Errors must never expose internal stack traces. Use `hint` for actionable guidance.

## Property-Based Testing Requirement

Every invariant named in a spec **must** have a corresponding property-based test using
`fast-check`. Properties run with 100+ iterations. Test names must include the
spec acceptance criterion ID, e.g.:

```ts
// engine-core 4.5 — evidence is never empty
it.prop([fc.record({ ... })])('finding always has evidence', (finding) => {
  expect(finding.evidence.length).toBeGreaterThan(0);
});
```

## Import Order (enforced by ESLint)

```
1. Node builtins
2. External packages
3. Internal aliases (@haunt/*)
4. Relative imports (deepest last)
```

Barrel files (`index.ts`) may only re-export, never contain logic.

# HauntView Concurrency Architecture

HauntView features an opt-in, hardware-aware profile concurrency engine designed to accelerate the execution of website resilience rites, accessibility audits, and visual chaos tests while safeguarding system stability.

---

## 1. Overview & Performance

By default, HauntView executes rites **sequentially** (one browser profile after another). Running all 25 profiles sequentially provides reliable execution on constrained hardware, but takes approximately **70–80 seconds** on standard web pages.

With profile concurrency enabled, independent browser contexts run in parallel across a bounded worker pool:

| Execution Mode           | Concurrency Amount | Approximate Full Run Duration (25 Profiles) | Memory Footprint   |
| :----------------------- | :----------------- | :------------------------------------------ | :----------------- |
| **Sequential (Default)** | 1 (off)            | ~70 – 80 seconds                            | ~600 MB peak       |
| **Concurrent (Optimal)** | 2 – 4 workers      | **~25 – 30 seconds**                        | ~1.5 – 2.5 GB peak |

### Resource Trade-offs

Each concurrent Playwright rite launches a headless browser context (Chromium, Firefox, or WebKit). Each active context consumes approximately 500–600 MB of RAM, plus additional memory during page rendering, DOM tree analysis, and pixelmatch visual diff generation. Concurrency significantly reduces wall-clock execution time, but demands sufficient CPU cores and available system memory.

---

## 2. Hardware Capability Heuristic

To prevent system lockups, excessive swap thrashing, or out-of-memory (OOM) crashes, HauntView includes an automated hardware assessment module ([`src/core/system-capability.ts`](file:///home/japheth/Desktop/hauntview/src/core/system-capability.ts)).

### The Heuristic Formula

The recommended maximum concurrency is computed from logical CPU cores and total system memory:

$$\text{cpuBound} = \max\left(1, \lfloor \frac{\text{logicalCores}}{2} \rfloor\right)$$

$$\text{ramBound} = \max\left(1, \lfloor \frac{\text{totalMemoryInGB}}{2} \rfloor\right)$$

$$\text{maxConcurrency} = \min(\text{cpuBound}, \text{ramBound}, 8)$$

#### Why these bounds?

- **CPU bound:** Hyperthreaded logical cores do not provide linear scaling under heavy browser page rendering. Dedicating two logical threads per active browser instance ensures smooth layout and paint execution without CPU starvation.
- **RAM bound:** Factoring 500–600 MB per browser context plus operating system headroom requires approximately 2 GB of total system RAM per active worker.
- **Global Ceiling (8):** A hard ceiling of 8 prevents browser socket exhaustion and network interface saturation.

### Low-Spec Machines (`maxConcurrency < 2`)

If a machine has fewer than 2 cores or less than 4 GB of total RAM, `maxConcurrency` resolves to `1`.

- **Setup Wizard:** `haunt setup` informs the user of their hardware specs, explains why concurrency cannot be enabled safely, forces `concurrency = false`, and refuses to prompt for concurrency amount.
- **Runtime Guard:** The CLI and engine clamp concurrency to `1` even if a configuration file copied from another machine requests higher concurrency.

### Setup Validation & Runtime Clamping

- When configuring `haunt setup`, entering a concurrency amount exceeding `maxConcurrency` results in an immediate refusal and a clear explanation of machine limits (e.g. _"Your Intel Core i3 (2 cores / 4 threads, 8 GB RAM) supports at most 2 concurrent rites; 6 would likely freeze the machine"_).
- If the configuration file is manually edited or transferred to an under-powered host, the runtime automatically clamps the concurrency level to the local machine's `maxConcurrency` and logs a warning.

---

## 3. Configuration & Precedence Order

Concurrency settings can be configured across multiple interfaces. HauntView resolves settings according to strict precedence (highest to lowest):

1. **Explicit Request / Flag (Highest Priority):**
   - CLI flags: `--concurrency` / `--no-concurrency`, `-a <n>` / `--concurrency-amount <n>`
   - HTTP API request payload: `{ "concurrency": true, "concurrencyAmount": 3 }`
   - MCP tool parameters: `concurrency: true`, `concurrencyAmount: 3`
2. **Environment Variables:**
   - `HAUNT_CONCURRENCY=1` (or `true`)
   - `HAUNT_CONCURRENCY_AMOUNT=<n>`
3. **Persistent Config:**
   - Saved settings in `~/.config/hauntview/config.json` (managed via `haunt setup`)
4. **Engine Defaults (Lowest Priority):**
   - `concurrency: false`
   - `concurrencyAmount: 2`

---

## 4. Failure Isolation & Deterministic Ordering

### Settled Worker Pool

Concurrent execution runs through a bounded promise pool implemented with `Promise.allSettled()` in [`src/engine.ts`](file:///home/japheth/Desktop/hauntview/src/engine.ts).

- If a single profile fails due to an unhandled exception, browser crash, or unexpected page navigation timeout, that failure is isolated to that specific rite.
- Sibling rites continue executing uninterrupted.
- The overall test run completes cleanly, recording the failure as an error-level finding in the final report without corrupting other results.

### Deterministic Result Sorting

Because concurrent workers finish in non-deterministic time depending on page complexity, HauntView re-sorts all rite results into canonical profile order before assembling the final report. Reports generated from concurrent runs maintain an identical structural ordering to sequential runs.

---

## 5. Hosted Environment Guard (`hauntview.onrender.com`)

HauntView's public demonstration instance is hosted on Render's free tier with strict container resource limits: **0.5 vCPU and 512 MB RAM**. Running multiple concurrent headless browser instances in this environment triggers immediate out-of-memory container restarts.

To ensure uptime and stability:

1. **Hosted Environment Detection:**
   The engine checks for `RENDER=true` or `HAUNT_HOSTED=1`.
2. **HTTP API Guard:**
   Calls to `POST /api/test` that specify `concurrency: true` are rejected with **HTTP 400 Bad Request**:
   ```json
   {
     "error": "Concurrency is disabled on the hosted instance to protect resource limits. Run tests locally via CLI or MCP for concurrent execution."
   }
   ```
3. **Engine Fallback:**
   The core engine forces `concurrency = false` whenever running on a hosted environment, unless the operator explicitly overrides it with `HAUNT_ALLOW_CONCURRENCY=1`.
4. **Web UI Notice:**
   The web test launcher automatically detects hosted mode and displays an informative banner explaining that full 25-rite runs take ~70 seconds and recommending the CLI for high-speed local runs.

---

## 6. Usage Examples

### CLI

```bash
# Enable concurrency with default pool (2 workers)
haunt https://example.com --concurrency

# Specify custom worker pool
haunt https://example.com -c -a 4

# Skip interactive prompts in CI
haunt https://example.com -c -a 2 --yes
```

### MCP (Kiro IDE / Claude Code / Cursor)

```json
{
  "name": "run-test-profile",
  "arguments": {
    "url": "http://localhost:3000",
    "profiles": ["mobile", "image-failure", "offline", "security-hygiene"],
    "concurrency": true,
    "concurrencyAmount": 2
  }
}
```

### Self-Hosted HTTP API

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profiles": ["mobile", "desktop", "js-disabled", "network-resilience"],
    "concurrency": true,
    "concurrencyAmount": 3
  }'
```

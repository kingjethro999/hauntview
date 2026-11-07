# HauntView CLI Reference (`haunt`)

HauntView provides an official, zero-dependency command-line interface (`haunt` or `hauntview`) for running website resilience rites, accessibility audits, and visual chaos testing directly from your terminal or CI/CD pipelines.

---

## 1. Installation

### Global Install via npm

```bash
npm install -g hauntview
```

### Direct Execution via npx

```bash
npx hauntview https://example.com
```

**Prerequisites:** Node.js 22 LTS or newer.

---

## 2. Command Overview

| Command               | Description                                                            |
| :-------------------- | :--------------------------------------------------------------------- |
| `haunt <url>`         | Execute testing rites against the specified URL                        |
| `haunt setup`         | Interactive wizard to configure defaults (outputs, paths, concurrency) |
| `haunt setup --show`  | Display current saved configuration and file path                      |
| `haunt setup --reset` | Reset configuration to factory defaults                                |
| `haunt doctor`        | System diagnostics: Node version, browsers, hardware capability        |
| `haunt --help`        | Display CLI help and flag reference                                    |
| `haunt --version`     | Display current HauntView version                                      |

---

## 3. Running Rites: `haunt <url>`

### Interactive Mode

When run interactively in a TTY:

```bash
haunt https://example.com
```

1. **URL Validation:** Validates the target URL. Local addresses (`http://localhost:*`, `http://127.0.0.1:*`) are permitted. Private network addresses (RFC 1918) are blocked by default unless `HAUNT_ALLOW_PRIVATE=1` is exported.
2. **First-Run Verification:** Confirms required Playwright browsers (Chromium, Firefox, WebKit) are present. If missing, prompts to install them automatically.
3. **Format Selection:** Automatically uses your saved `defaultFormats` from `haunt setup` without interrupting you. Pass `-i` / `--interactive` to prompt for formats on the fly, or specify `-o html,md,zip`.
4. **Live Progress Loader:** Runs the rites with a real-time progress bar, live profile timer, completed count, and adaptive spinner (Unicode on modern terminals, clean ASCII on legacy consoles).
5. **Artifact Generation:** Writes reports to the export directory and outputs the full paths and a findings breakdown.

### Non-Interactive / CI Flags

For automation, CI pipelines, or running specific profiles:

```bash
# Run specific profiles via direct flags
haunt https://example.com --mobile --desktop --offline --broken-links

# Run an entire category via shortcut flags
haunt https://example.com --a11y
haunt https://example.com --resilience

# Run profiles via comma-separated tags or profile IDs
haunt https://example.com --tag mobile,resilience
haunt https://example.com --tags devices,faults

# CI full run with custom outputs and concurrency
haunt https://example.com \
  --output zip,html \
  --out-dir ./reports \
  --concurrency \
  --concurrency-amount 2 \
  --yes
```

#### Profile Selection Flags & Category Tags

You can filter which profiles execute by specifying direct flags, category shortcuts, or `--tag`:

| Category / Flag                 | Description                            | Included Profiles                                                                                                |
| :------------------------------ | :------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `--tag <tags>`, `--tags <tags>` | Comma-separated tags or profile IDs    | User-specified tags (e.g. `a11y,resilience,mobile`)                                                              |
| `--a11y`, `--accessibility`     | All accessibility testing rites        | `a11y-screenreader`, `a11y-keyboard`, `a11y-visual`, `a11y-cognitive`                                            |
| `--resilience`                  | All resilience & recovery rites        | `offline`, `broken-links`, `network-resilience`, `form-resilience`                                               |
| `--devices`                     | All responsive device viewports        | `mobile`, `tablet`, `desktop`, `mobile-iphone15`, `mobile-android`, `tablet-ipad`, `desktop-1080p`, `desktop-4k` |
| `--browsers`                    | All browser engine compatibility rites | `browser-webkit`, `browser-firefox`, `browser-edge`, `browser-legacy`                                            |
| `--i18n`                        | All internationalization rites         | `i18n-rtl`, `i18n-cjk`, `i18n-mixed`                                                                             |
| `--faults`                      | Environmental fault injection rites    | `image-failure`, `font-failure`, `js-disabled`, `reduced-motion`                                                 |

##### Direct Profile Flags

- `--mobile`: Canonical mobile viewport (390×844)
- `--desktop`: Canonical desktop viewport (1280×800)
- `--tablet`: Canonical tablet viewport (820×1180)
- `--offline`: Offline service worker & cache resilience
- `--broken-links`: Probes same-origin anchor hrefs for 404/410/5xx errors
- `--network-resilience`: Aborts fetch/XHR requests to test graceful degradation
- `--form-resilience`: Tests empty/invalid form submission feedback
- `--performance`: Core Web Vitals (FCP, LCP, CLS, FID)
- `--security-hygiene`, `--security`: HTTP security response headers
- `--image-failure`: Missing alt tags and layout shift when images fail
- `--font-failure`: Font blocking layout shift detection
- `--js-disabled`: No-JS degradation and `<noscript>` fallbacks
- `--reduced-motion`: `prefers-reduced-motion` compliance
- `--console-errors`: Uncaught exceptions and runtime console errors
- `--a11y-visual`: Color contrast (WCAG AA 4.5:1) & high-contrast mode
- `--a11y-keyboard`: Focus order, trap detection, keyboard accessibility
- `--a11y-screenreader`: ARIA roles, skip-link, heading hierarchy
- `--a11y-cognitive`: Reading level, complex sentence density, clutter
- `--i18n-rtl`: Right-to-left layout and mirrored UI
- `--i18n-cjk`: Chinese/Japanese/Korean glyph rendering & word break
- `--i18n-mixed`: Mixed script rendering
- `--browser-webkit`, `--webkit`: WebKit engine rendering
- `--browser-firefox`, `--firefox`: Firefox engine rendering
- `--browser-edge`, `--edge`: Microsoft Edge compatibility
- `--browser-legacy`: Legacy browser CSS & JS compatibility
- `--mobile-iphone15`: iPhone 15 Pro viewport (390×844, 3x DPR)
- `--mobile-android`: Samsung Galaxy S23 viewport (360×800, 2x DPR)
- `--tablet-ipad`: iPad Pro 12.9" viewport (1024×1366, 2x DPR)
- `--desktop-1080p`: Standard 1080p desktop (1920×1080)
- `--desktop-4k`: 4K UHD desktop (3840×2160)

#### General CLI Flags

| Flag                       | Short | Description                                            | Default                        |
| :------------------------- | :---- | :----------------------------------------------------- | :----------------------------- |
| `--output <formats>`       | `-o`  | Comma-separated list of formats (`zip`, `html`, `md`)  | From saved config (`zip,html`) |
| `--out-dir <path>`         | `-d`  | Output directory (supports `.`, absolute, `~`)         | From saved config (`.`)        |
| `--profiles <ids>`         | `-p`  | Comma-separated profile IDs to execute                 | All 29 profiles                |
| `--concurrency`            | `-c`  | Enable concurrent profile execution                    | From saved config              |
| `--no-concurrency`         |       | Force sequential profile execution                     | False                          |
| `--concurrency-amount <n>` | `-a`  | Worker concurrency pool size (subject to hardware cap) | From saved config (`2`)        |
| `--yes`                    | `-y`  | Skip interactive prompts and accept saved defaults     | `false`                        |

---

## 4. Exit Codes

The CLI returns predictable exit codes for CI/CD test gates:

- **`0`**: Success. All requested profiles executed and **zero error-severity findings** were discovered (may have `warning` or `info` findings).
- **`1`**: Test failure. Rites executed, but **one or more error-severity findings** were discovered.
- **`2`**: Runtime error. URL validation failure, unhandled exception, missing permissions, or invalid configuration.

---

## 5. Global Setup: `haunt setup`

Run `haunt setup` to start the interactive configuration wizard:

```text
👻 HauntView CLI Setup Wizard
=========================================
1. Default Report Formats:
   Select which formats should be pre-checked when running `haunt <url>`:
   [x] Zip  [x] HTML  [ ] Markdown

2. Default Export Directory:
   Enter target export folder (. for current working directory, ~ for home):
   > ./haunt-reports

3. Profile Concurrency:
   System Check: 8 logical CPUs, 16.0 GB total RAM (11.2 GB available).
   Recommended concurrency: up to 4 concurrent browser rites.
   Enable concurrent execution by default? (Y/n)
   Concurrency Amount (1-4): 2
```

### Path Resolution

The export path supports:

- `.` — Resolves to the current working directory where `haunt` is invoked.
- `~` — Cross-platform expansion to the user's home directory (`/home/<user>` on Linux, `/Users/<user>` on macOS, `C:\Users\<user>` on Windows).
- Absolute paths — e.g. `/var/reports` or `D:\Audits`.

The wizard validates that the directory exists or can be created, and verifies write permissions before saving.

### Config Storage

Configuration is stored per user in standard OS config directories:

- **Linux:** `~/.config/hauntview/config.json`
- **macOS:** `~/Library/Preferences/hauntview/config.json`
- **Windows:** `%APPDATA%\hauntview\config.json`

---

## 6. System Diagnostics: `haunt doctor`

Run `haunt doctor` to inspect your environment and verify system capabilities:

```bash
haunt doctor
```

Output:

```text
👻 HauntView System Doctor
=========================================
Environment:
  Node.js:          v22.11.0
  Platform:         linux (x64)
  HauntView:        v0.0.4
  Config Path:      /home/user/.config/hauntview/config.json

Browser Engines:
  Chromium:         Installed
  Firefox:          Installed
  WebKit:           Installed

System Capability:
  CPU:              AMD Ryzen 7 7840HS (16 logical cores)
  Memory:           31.1 GB total (18.4 GB available)
  Max Concurrency:  8 concurrent rites
  Recommended:      4 concurrent rites
```

---

## 7. First-Run Setup & Linux Dependencies

### Automatic Browser Installation

On its first run, `haunt` checks for the presence of Playwright browsers (Chromium, Firefox, WebKit). If missing, it downloads them automatically. The download takes 1–3 minutes depending on network bandwidth (~150–300 MB per browser engine).

A best-effort `postinstall` script also attempts this download during `npm install -g hauntview`, but is safely wrapped in `try/catch` so it will never fail global npm installs in locked-down or `--ignore-scripts` environments.

### Linux System Dependencies

On Linux distributions (Debian, Ubuntu, Arch, Fedora), WebKit and Chromium require specific system shared libraries (e.g. `libgstreamer`, `libgtk-3`). If missing, Playwright will report missing dependencies.

Run Playwright's dependency installer to install required packages:

```bash
sudo npx playwright install-deps
```

---

## 8. Export Formats & Why PDF is Web-Only

The CLI supports three export formats:

1. **Zip Archive (`.zip`)**: A self-contained bundle containing:
   - Full interactive HTML report
   - Markdown summary
   - High-resolution screenshot plates, baseline captures, and pixelmatch visual diffs
   - Machine-readable JSON manifest
2. **HTML Report (`.html`)**: Single-file Victorian Parlour report with embedded SVG icons, CSS styling, and client-side filterable finding tables.
3. **Markdown Report (`.md`)**: GitHub-flavored markdown report structured for issue trackers, pull requests, and PR comments.

### Why PDF Export is Web-Only

In the HauntView Web UI, PDF generation is handled client-side via CSS `@media print` stylesheets and the native browser print dialogue.

Implementing headless PDF generation in the CLI would require launching an additional Chromium headless instance specifically to call `page.pdf()`. This adds substantial memory overhead, increases execution duration, and fails on Firefox and WebKit profile tests. Instead, the **Zip** format provides an all-inclusive archive containing full visual plates and reports without any web runtime bloat.

---

## 9. Extensive Windows & Unix System Support

HauntView provides first-class support tailored to the unique characteristics of Windows (win32) and Unix environments (Linux, macOS, BSD, WSL).

### Windows Support Highlights

- **Path Syntax & Environment Expansion:**
  - Full support for Windows drive letters (`C:\...`, `D:\...`), backslashes (`\`), forward slashes (`/`), and UNC network shares (`\\server\share`).
  - Seamless expansion of Windows environment variables (`%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`, `%TEMP%`) in both CLI flags and the interactive `haunt setup` wizard.
  - Tilde (`~`) expands cross-platform to `%USERPROFILE%` on Windows and `$HOME` on Unix.
- **Native Microsoft Edge Execution:**
  - On Windows, the `browser-edge` profile automatically detects and drives the host's native Microsoft Edge installation (`channel: 'msedge'`), evaluating real Windows High Contrast modes (`forced-colors`) and Edge PWA integration.
  - On non-Windows platforms where Edge is absent, it degrades gracefully to standard Chromium with an informative notice.
- **Adaptive Terminal Rendering:**
  - On modern Windows Terminal, VS Code, and PowerShell, rich Unicode icons (`👻`, `✓`, `✗`, `⏳`) are rendered.
  - On legacy Windows Command Prompt (`cmd.exe`), clean ASCII fallbacks (`[HauntView]`, `[OK]`, `[ERR]`, `[*]`) prevent character encoding errors.
- **Process & Signal Management:**
  - Safe interrupt handling for Ctrl+C (`SIGINT`), `SIGTERM`, and `SIGBREAK` ensures all background browser processes (Chromium, Firefox, WebKit, Edge) are cleaned up cleanly without orphaned `chrome.exe` tasks in Windows Task Manager.
- **PowerShell Execution Policy:**
  - If script execution is blocked on Windows, execute:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
    ```
- **Configuration Storage:**
  - Windows: `%APPDATA%\hauntview\config.json`
  - macOS: `~/Library/Preferences/hauntview/config.json`
  - Linux / Unix: `$XDG_CONFIG_HOME/hauntview/config.json` or `~/.config/hauntview/config.json`

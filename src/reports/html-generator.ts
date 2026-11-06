/**
 * HTML Report Generator - Victorian Spirit Photography Grimoire
 * Professional haunted aesthetic without emojis
 */

import { TestReport, Finding } from '../types';
import { ReportGenerator, ReportOptions, GeneratedReport } from './types';

interface HTMLReportStatistics {
  totalProfiles: number;
  successfulProfiles: number;
  errorCount: number;
  totalFindings: number;
}

interface HTMLReportTheme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  border: string;
}

export class HTMLReportGenerator implements ReportGenerator {
  async generate(report: TestReport, options: ReportOptions): Promise<GeneratedReport> {
    const content = this.generateHTMLContent(report, options);
    const filename = `hauntview-grimoire-${report.id}.html`;

    return {
      format: 'html',
      content,
      filename,
      mimeType: 'text/html',
    };
  }

  private generateHTMLContent(report: TestReport, options: ReportOptions): string {
    const theme = this.darkTheme();
    const findings = this.getAllFindings(report);
    const statistics = this.calculateStatistics(report);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HauntView Grimoire - Séance Report</title>
  <style>
    ${this.getStyles(theme)}
  </style>
</head>
<body>
  <div class="parchment">
    ${this.renderHeader(report, statistics)}
    ${this.renderTOC()}
    ${this.renderExecutiveSummary(report, statistics)}
    ${this.renderFindingsBySeverity(findings)}
    ${this.renderFindingsByCategory(findings)}
    ${this.renderProfileDetails(report)}
    ${options.includeScreenshots ? this.renderScreenshots(report) : ''}
    ${this.renderFooter()}
  </div>
</body>
</html>`;
  }

  private renderHeader(report: TestReport, statistics: HTMLReportStatistics): string {
    const theme = this.darkTheme();
    const passRate = ((statistics.successfulProfiles / statistics.totalProfiles) * 100).toFixed(1);
    const hasErrors = statistics.errorCount > 0;

    return `
    <header class="grimoire-header">
      <div class="wax-seal">
        <svg viewBox="0 0 100 100" class="seal-svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
          <path d="M50 20 L50 35 M50 65 L50 80 M20 50 L35 50 M65 50 L80 50" stroke="${theme.accent}" stroke-width="2"/>
          <circle cx="50" cy="50" r="15" fill="${theme.accent}" opacity="0.3"/>
        </svg>
      </div>
      <div class="header-content">
        <div class="specimen-label">SPIRIT PHOTOGRAPHY GRIMOIRE</div>
        <h1>HauntView Séance Report</h1>
        <p class="subtitle">Web Resilience Audit • Kiroween 2026</p>
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">House</span>
            <code class="meta-value">${this.escapeHtml(report.url)}</code>
          </div>
          <div class="meta-item">
            <span class="meta-label">Duration</span>
            <span class="meta-value">${(report.duration / 1000).toFixed(2)}s</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Generated</span>
            <span class="meta-value">${new Date(report.startTime).toLocaleString()}</span>
          </div>
        </div>
        <div class="status-banner ${hasErrors ? 'has-errors' : 'no-errors'}">
          <div class="status-badge">
            ${hasErrors ? 'OMENS DETECTED' : 'NO OMENS'}
          </div>
          <div class="status-metrics">
            <span>${passRate}% rites passed</span>
            <span>${statistics.totalFindings} findings</span>
          </div>
        </div>
      </div>
    </header>`;
  }

  private renderTOC(): string {
    return `
    <nav class="table-of-contents">
      <h2>Contents</h2>
      <ul>
        <li><a href="#summary">Executive Summary</a></li>
        <li><a href="#severity">Omens by Severity</a></li>
        <li><a href="#category">Omens by Category</a></li>
        <li><a href="#profiles">Rite Details</a></li>
        ${this.hasScreenshots() ? '<li><a href="#apparitions">Gallery of Apparitions</a></li>' : ''}
      </ul>
    </nav>`;
  }

  private renderExecutiveSummary(report: TestReport, statistics: HTMLReportStatistics): string {
    return `
    <section id="summary" class="section">
      <div class="section-header">
        <h2>Executive Summary</h2>
        <div class="section-decorator"></div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${statistics.totalProfiles}</div>
          <div class="metric-label">Rites Conducted</div>
        </div>
        <div class="metric-card">
          <div class="metric-value success">${statistics.successfulProfiles}</div>
          <div class="metric-label">Passed</div>
        </div>
        <div class="metric-card">
          <div class="metric-value ${statistics.errorCount > 0 ? 'error' : 'success'}">${statistics.errorCount}</div>
          <div class="metric-label">Screams</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${statistics.totalFindings}</div>
          <div class="metric-label">Total Omens</div>
        </div>
      </div>
      <div class="breakdown-panel">
        <h3>Omen Distribution</h3>
        <table class="distribution-table">
          <tbody>
            <tr>
              <td class="severity-label serious">Screams</td>
              <td><span class="count-badge serious">${report.summary.findingsBySeverity.error}</span></td>
            </tr>
            <tr>
              <td class="severity-label warning">Chills</td>
              <td><span class="count-badge warning">${report.summary.findingsBySeverity.warning}</span></td>
            </tr>
            <tr>
              <td class="severity-label whisper">Whispers</td>
              <td><span class="count-badge whisper">${report.summary.findingsBySeverity.info}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
  }

  private renderFindingsBySeverity(findings: Finding[]): string {
    const bySeverity = this.groupBySeverity(findings);
    const severities: Array<'error' | 'warning' | 'info'> = ['error', 'warning', 'info'];

    let html = `<section id="severity" class="section">
      <div class="section-header">
        <h2>Omens by Severity</h2>
        <div class="section-decorator"></div>
      </div>`;

    for (const severity of severities) {
      const items = bySeverity[severity] || [];
      const severityName =
        severity === 'error' ? 'Screams' : severity === 'warning' ? 'Chills' : 'Whispers';

      html += `
      <div class="omen-group">
        <h3 class="severity-${severity}">
          <span class="severity-icon"></span>
          ${severityName} (${items.length})
        </h3>
        ${
          items.length > 0
            ? `
        <table class="omen-table">
          <thead>
            <tr>
              <th>Rite</th>
              <th>Category</th>
              <th>Omen</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join('')}
          </tbody>
        </table>
        `
            : '<p class="no-omens">No omens of this severity</p>'
        }
      </div>`;
    }

    html += `</section>`;
    return html;
  }

  private renderFindingsByCategory(findings: Finding[]): string {
    const byCategory = this.groupByCategory(findings);

    let html = `<section id="category" class="section">
      <div class="section-header">
        <h2>Omens by Category</h2>
        <div class="section-decorator"></div>
      </div>`;

    for (const [category, items] of Object.entries(byCategory)) {
      html += `
      <div class="omen-group">
        <h3>
          <span class="category-icon"></span>
          ${category} (${items.length})
        </h3>
        ${
          items.length > 0
            ? `
        <table class="omen-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Rite</th>
              <th>Omen</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join('')}
          </tbody>
        </table>
        `
            : '<p class="no-omens">No omens in this category</p>'
        }
      </div>`;
    }

    html += `</section>`;
    return html;
  }

  private renderProfileDetails(report: TestReport): string {
    let html = `<section id="profiles" class="section">
      <div class="section-header">
        <h2>Rite Details</h2>
        <div class="section-decorator"></div>
      </div>`;

    for (const profile of report.profileResults) {
      const statusIcon = profile.success ? '✓' : '✗';

      html += `
      <div class="rite-card">
        <div class="rite-header ${profile.success ? 'passed' : 'failed'}">
          <div class="rite-status">${statusIcon}</div>
          <div class="rite-info">
            <h3>${profile.profileName}</h3>
            <div class="rite-meta">
              <span>Duration: ${profile.duration}ms</span>
              <span>Findings: ${profile.findings.length}</span>
            </div>
          </div>
        </div>
        <div class="rite-findings">
          ${
            profile.findings.length > 0
              ? `
            <table class="omen-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Omen</th>
                </tr>
              </thead>
              <tbody>
                ${profile.findings.map((f) => this.renderFindingRow(f)).join('')}
              </tbody>
            </table>
          `
              : '<p class="no-omens">No omens detected</p>'
          }
        </div>
      </div>`;
    }

    html += `</section>`;
    return html;
  }

  private renderScreenshots(report: TestReport): string {
    const allScreenshots = report.profileResults
      .flatMap((p) => p.screenshots.map((s) => ({ ...s, profile: p.profileName })))
      .filter((s) => s.fileName);

    if (allScreenshots.length === 0) {
      return '';
    }

    let html = `<section id="apparitions" class="section">
      <div class="section-header">
        <h2>Gallery of Apparitions</h2>
        <div class="section-decorator"></div>
      </div>
      <div class="apparition-grid">`;

    for (const screenshot of allScreenshots) {
      const src =
        screenshot.fileName.startsWith('screenshots/') ||
        screenshot.fileName.startsWith('http') ||
        screenshot.fileName.startsWith('/')
          ? screenshot.fileName
          : `screenshots/${screenshot.fileName}`;

      html += `
      <div class="apparition-plate">
        <div class="plate-header">
          <span class="plate-label">${screenshot.profile}</span>
          <span class="plate-time">${new Date(screenshot.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="plate-frame">
          <img src="${src}" alt="Apparition from ${screenshot.profile}">
        </div>
      </div>`;
    }

    html += `</div></section>`;
    return html;
  }

  private renderFindingRow(finding: Finding): string {
    const screenshotRef = finding.details?.screenshot as string | undefined;
    const screenshotSrc = screenshotRef
      ? screenshotRef.startsWith('screenshots/') ||
        screenshotRef.startsWith('http') ||
        screenshotRef.startsWith('/')
        ? screenshotRef
        : `screenshots/${screenshotRef}`
      : null;

    return `
    <tr>
      <td><span class="severity-mark severity-${finding.severity}">${finding.severity.toUpperCase()}</span></td>
      <td>${this.escapeHtml(finding.category)}</td>
      <td>
        <span class="omen-text">${this.escapeHtml(finding.message)}</span>
        ${
          screenshotSrc
            ? `<div class="screenshot-link"><a href="${screenshotSrc}" target="_blank">View Apparition Plate</a></div>`
            : ''
        }
      </td>
    </tr>`;
  }

  private renderFooter(): string {
    return `
    <footer class="grimoire-footer">
      <div class="footer-seal">
        <svg viewBox="0 0 60 60" class="footer-ghost">
          <path d="M30 10 C20 10, 15 20, 15 30 C15 40, 20 50, 30 50 C40 50, 45 40, 45 30 C45 20, 40 10, 30 10" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="25" cy="25" r="2" fill="currentColor"/>
          <circle cx="35" cy="25" r="2" fill="currentColor"/>
          <path d="M30 35 L25 45 L35 45 Z" fill="currentColor"/>
        </svg>
      </div>
      <div class="footer-content">
        <p>Generated by <strong>HauntView v0.1.0</strong></p>
        <p>Kiroween 2026 Hackathon Submission</p>
        <p class="footer-motto">See what breaks before your users do</p>
      </div>
    </footer>`;
  }

  private getStyles(theme: HTMLReportTheme): string {
    return `
      :root {
        --primary: ${theme.primary};
        --secondary: ${theme.secondary};
        --accent: ${theme.accent};
        --bg: ${theme.bg};
        --bg-alt: ${theme.bgAlt};
        --text: ${theme.text};
        --text-muted: ${theme.textMuted};
        --border: ${theme.border};
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        background-color: var(--bg);
        color: var(--text);
        line-height: 1.7;
        background-image: 
          radial-gradient(#8a829518 0.5px, transparent 0.5px),
          radial-gradient(ellipse at 85% 15%, rgba(45, 31, 61, 0.4), transparent 50%),
          radial-gradient(ellipse at 20% 85%, rgba(255, 121, 31, 0.12), transparent 45%);
        background-size: 20px 20px, 100% 100%, 100% 100%;
        background-attachment: fixed;
      }

      .parchment {
        max-width: 1000px;
        margin: 0 auto;
        padding: 60px 40px;
        background: linear-gradient(160deg, rgba(28, 21, 35, 0.9) 0%, rgba(15, 11, 21, 0.95) 100%);
        border: 1px solid rgba(255, 121, 31, 0.2);
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 157, 77, 0.08);
      }

      .grimoire-header {
        text-align: center;
        padding: 40px 0 50px;
        border-bottom: 2px solid var(--border);
        margin-bottom: 50px;
        position: relative;
      }

      .wax-seal {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        position: relative;
      }

      .seal-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 12px rgba(255, 121, 31, 0.4));
      }

      .specimen-label {
        font-family: 'Courier New', monospace;
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--accent);
        background: rgba(255, 121, 31, 0.08);
        border: 1px solid rgba(255, 121, 31, 0.3);
        padding: 6px 12px;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: 16px;
      }

      .header-content h1 {
        font-size: 2.8rem;
        font-weight: 600;
        letter-spacing: -0.03em;
        margin-bottom: 8px;
        color: var(--text);
      }

      .subtitle {
        font-size: 1rem;
        color: var(--text-muted);
        margin-bottom: 30px;
        font-style: italic;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: rgba(28, 21, 35, 0.5);
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .meta-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 4px;
      }

      .meta-value {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: var(--text);
      }

      .status-banner {
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: center;
        padding: 16px;
        border-radius: 4px;
        margin-top: 20px;
      }

      .status-banner.no-errors {
        background: rgba(22, 163, 74, 0.1);
        border: 1px solid rgba(22, 163, 74, 0.3);
      }

      .status-banner.has-errors {
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
      }

      .status-badge {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .status-banner.no-errors .status-badge {
        background: rgba(22, 163, 74, 0.2);
        color: #86efac;
      }

      .status-banner.has-errors .status-badge {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .status-metrics {
        display: flex;
        gap: 20px;
        font-size: 13px;
        color: var(--text-muted);
      }

      .table-of-contents {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        margin-bottom: 50px;
        border-left: 3px solid var(--accent);
      }

      .table-of-contents h2 {
        font-size: 1.2rem;
        margin-bottom: 16px;
        color: var(--text);
      }

      .table-of-contents ul {
        list-style: none;
      }

      .table-of-contents li {
        margin: 10px 0;
      }

      .table-of-contents a {
        color: var(--accent);
        text-decoration: none;
        font-size: 14px;
        transition: color 0.2s;
      }

      .table-of-contents a:hover {
        color: #ff9448;
        text-decoration: underline;
      }

      .section {
        margin-bottom: 60px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }

      .section-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text);
      }

      .section-decorator {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, var(--accent), transparent);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .metric-card {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        text-align: center;
        border-top: 3px solid var(--accent);
      }

      .metric-value {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--accent);
        margin-bottom: 8px;
      }

      .metric-value.success {
        color: #86efac;
      }

      .metric-value.error {
        color: #fca5a5;
      }

      .metric-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
      }

      .breakdown-panel {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
      }

      .breakdown-panel h3 {
        font-size: 1rem;
        margin-bottom: 16px;
        color: var(--text);
      }

      .distribution-table {
        width: 100%;
        border-collapse: collapse;
      }

      .distribution-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      .severity-label {
        font-size: 13px;
        font-weight: 500;
      }

      .severity-label.serious {
        color: #fca5a5;
      }

      .severity-label.warning {
        color: #fed7aa;
      }

      .severity-label.whisper {
        color: #93c5fd;
      }

      .count-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
      }

      .count-badge.serious {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .count-badge.warning {
        background: rgba(234, 88, 12, 0.2);
        color: #fed7aa;
      }

      .count-badge.whisper {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }

      .omen-group {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        margin-bottom: 20px;
      }

      .omen-group h3 {
        font-size: 1.1rem;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .severity-icon {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .severity-error .severity-icon {
        background: #dc2626;
        box-shadow: 0 0 8px rgba(220, 38, 38, 0.6);
      }

      .severity-warning .severity-icon {
        background: #ea580c;
        box-shadow: 0 0 8px rgba(234, 88, 12, 0.6);
      }

      .severity-info .severity-icon {
        background: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
      }

      .category-icon {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: var(--accent);
      }

      .omen-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .omen-table thead {
        background: rgba(255, 121, 31, 0.1);
      }

      .omen-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }

      .omen-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      .omen-table tbody tr:hover {
        background: rgba(255, 121, 31, 0.05);
      }

      .severity-mark {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .severity-mark.serious {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .severity-mark.warning {
        background: rgba(234, 88, 12, 0.2);
        color: #fed7aa;
      }

      .severity-mark.info {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }

      .omen-text {
        color: var(--text);
      }

      .screenshot-link {
        margin-top: 6px;
      }

      .screenshot-link a {
        color: var(--accent);
        font-size: 11px;
        text-decoration: none;
        transition: color 0.2s;
      }

      .screenshot-link a:hover {
        color: #ff9448;
        text-decoration: underline;
      }

      .no-omens {
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      .rite-card {
        background: rgba(28, 21, 35, 0.5);
        border-radius: 6px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .rite-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-left: 4px solid;
      }

      .rite-header.passed {
        border-left-color: #86efac;
      }

      .rite-header.failed {
        border-left-color: #fca5a5;
      }

      .rite-status {
        font-size: 24px;
        font-weight: 600;
      }

      .rite-header.passed .rite-status {
        color: #86efac;
      }

      .rite-header.failed .rite-status {
        color: #fca5a5;
      }

      .rite-info h3 {
        font-size: 14px;
        margin-bottom: 4px;
        color: var(--text);
      }

      .rite-meta {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .rite-findings {
        padding: 16px 20px;
      }

      .apparition-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }

      .apparition-plate {
        background: rgba(28, 21, 35, 0.5);
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .plate-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(255, 121, 31, 0.05);
        border-bottom: 1px solid var(--border);
      }

      .plate-label {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: var(--accent);
      }

      .plate-time {
        font-size: 11px;
        color: var(--text-muted);
      }

      .plate-frame {
        aspect-ratio: 16/10;
        background: #0a0711;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .plate-frame img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .grimoire-footer {
        margin-top: 60px;
        padding-top: 30px;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .footer-seal {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      .footer-ghost {
        width: 100%;
        height: 100%;
        color: var(--accent);
        opacity: 0.5;
      }

      .footer-content {
        flex: 1;
      }

      .footer-content p {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 4px;
      }

      .footer-content strong {
        color: var(--text);
      }

      .footer-motto {
        font-style: italic;
        color: var(--accent);
      }

      @media (max-width: 768px) {
        .parchment {
          padding: 30px 20px;
        }

        .header-content h1 {
          font-size: 2rem;
        }

        .meta-grid {
          grid-template-columns: 1fr;
        }

        .metrics-grid {
          grid-template-columns: 1fr 1fr;
        }

        .omen-table {
          font-size: 12px;
        }

        .omen-table th,
        .omen-table td {
          padding: 8px 12px;
        }

        .apparition-grid {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        body {
          background: white;
          color: black;
        }

        .parchment {
          box-shadow: none;
          border: 1px solid #ccc;
        }

        .table-of-contents {
          page-break-after: always;
        }

        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  private darkTheme(): HTMLReportTheme {
    return {
      primary: '#1c1629',
      secondary: '#0a0711',
      accent: '#ff791f',
      bg: '#0a0711',
      bgAlt: '#1c1629',
      text: '#f5f0e8',
      textMuted: '#8a8295',
      border: '#46334b',
    };
  }

  private getAllFindings(report: TestReport): Finding[] {
    return report.profileResults.flatMap((p) => p.findings);
  }

  private hasScreenshots(): boolean {
    return true;
  }

  private calculateStatistics(report: TestReport) {
    const allFindings = this.getAllFindings(report);

    return {
      totalProfiles: report.profileResults.length,
      successfulProfiles: report.profileResults.filter((p) => p.success).length,
      errorCount: allFindings.filter((f) => f.severity === 'error').length,
      totalFindings: allFindings.length,
    };
  }

  private groupBySeverity(findings: Finding[]): Record<string, Finding[]> {
    return {
      error: findings.filter((f) => f.severity === 'error'),
      warning: findings.filter((f) => f.severity === 'warning'),
      info: findings.filter((f) => f.severity === 'info'),
    };
  }

  private groupByCategory(findings: Finding[]): Record<string, Finding[]> {
    const grouped: Record<string, Finding[]> = {};

    for (const finding of findings) {
      const category = finding.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(finding);
    }

    return grouped;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * HTML Report Generator - Creates professional HTML reports with Halloween theme
 */

import { TestReport, Finding } from '../types';
import { ReportGenerator, ReportOptions, GeneratedReport, FindingGroup } from './types';

export class HTMLReportGenerator implements ReportGenerator {
  async generate(report: TestReport, options: ReportOptions): Promise<GeneratedReport> {
    const content = this.generateHTMLContent(report, options);
    const filename = `hauntview-report-${new Date().getTime()}.html`;

    return {
      format: 'html',
      content,
      filename,
      mimeType: 'text/html',
    };
  }

  private generateHTMLContent(report: TestReport, options: ReportOptions): string {
    const theme = options.theme === 'light' ? this.lightTheme() : this.darkTheme();
    const findings = this.getAllFindings(report);
    const statistics = this.calculateStatistics(report);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HauntView Testing Report</title>
  <style>
    ${this.getStyles(theme)}
  </style>
</head>
<body>
  <div class="container">
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

  private renderHeader(report: TestReport, statistics: any): string {
    const passRate = ((statistics.successfulProfiles / statistics.totalProfiles) * 100).toFixed(1);
    const statusColor = statistics.errorCount === 0 ? '#4CAF50' : '#f44336';

    return `
    <header class="header">
      <div class="header-content">
        <h1>👻 HauntView Testing Report</h1>
        <p class="subtitle">Comprehensive Web Testing Analysis</p>
        <div class="meta">
          <span>📍 URL: <code>${this.escapeHtml(report.url)}</code></span>
          <span>⏱️ Duration: ${(report.duration / 1000).toFixed(2)}s</span>
          <span>📅 Generated: ${new Date(report.startTime).toLocaleString()}</span>
        </div>
        <div class="status" style="border-color: ${statusColor};">
          <div class="status-badge" style="background-color: ${statusColor};">
            ${statistics.errorCount === 0 ? '✓ PASS' : '✗ ISSUES'}
          </div>
          <div class="status-stats">
            <span>${passRate}% profiles passed</span>
            <span>${statistics.totalFindings} findings</span>
          </div>
        </div>
      </div>
    </header>`;
  }

  private renderTOC(): string {
    return `
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>
        <li><a href="#summary">Executive Summary</a></li>
        <li><a href="#severity">Findings by Severity</a></li>
        <li><a href="#category">Findings by Category</a></li>
        <li><a href="#profiles">Profile Details</a></li>
      </ul>
    </nav>`;
  }

  private renderExecutiveSummary(report: TestReport, statistics: any): string {
    return `
    <section id="summary" class="section">
      <h2>Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${statistics.totalProfiles}</div>
          <div class="summary-label">Profiles Run</div>
        </div>
        <div class="summary-card">
          <div class="summary-value" style="color: #4CAF50;">${statistics.successfulProfiles}</div>
          <div class="summary-label">Passed</div>
        </div>
        <div class="summary-card">
          <div class="summary-value" style="color: #f44336;">${statistics.errorCount}</div>
          <div class="summary-label">Errors</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${statistics.totalFindings}</div>
          <div class="summary-label">Total Findings</div>
        </div>
      </div>
      <div class="findings-breakdown">
        <h3>Findings Breakdown</h3>
        <table class="breakdown-table">
          <tbody>
            <tr>
              <td>Errors</td>
              <td><span class="badge error">${report.summary.findingsBySeverity.error}</span></td>
            </tr>
            <tr>
              <td>Warnings</td>
              <td><span class="badge warning">${report.summary.findingsBySeverity.warning}</span></td>
            </tr>
            <tr>
              <td>Info</td>
              <td><span class="badge info">${report.summary.findingsBySeverity.info}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
  }

  private renderFindingsBySeverity(findings: Finding[]): string {
    const bySeverity = this.groupBySeverity(findings);
    const severities: Array<'error' | 'warning' | 'info'> = ['error', 'warning', 'info'];

    let html = `<section id="severity" class="section"><h2>Findings by Severity</h2>`;

    for (const severity of severities) {
      const items = bySeverity[severity] || [];
      html += `
      <div class="finding-group">
        <h3 class="severity-${severity}">
          ${severity === 'error' ? '🔴' : severity === 'warning' ? '🟡' : '🔵'} ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${items.length})
        </h3>
        <table class="findings-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Category</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join('')}
          </tbody>
        </table>
      </div>`;
    }

    html += `</section>`;
    return html;
  }

  private renderFindingsByCategory(findings: Finding[]): string {
    const byCategory = this.groupByCategory(findings);

    let html = `<section id="category" class="section"><h2>Findings by Category</h2>`;

    for (const [category, items] of Object.entries(byCategory)) {
      html += `
      <div class="finding-group">
        <h3>📂 ${category} (${items.length})</h3>
        <table class="findings-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Profile</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join('')}
          </tbody>
        </table>
      </div>`;
    }

    html += `</section>`;
    return html;
  }

  private renderProfileDetails(report: TestReport): string {
    let html = `<section id="profiles" class="section"><h2>Profile Details</h2>`;

    for (const profile of report.profileResults) {
      const statusIcon = profile.success ? '✓' : '✗';
      const statusColor = profile.success ? '#4CAF50' : '#f44336';

      html += `
      <div class="profile-card">
        <div class="profile-header" style="border-left-color: ${statusColor};">
          <h3>${statusIcon} ${profile.profileName}</h3>
          <div class="profile-meta">
            <span>Duration: ${profile.duration}ms</span>
            <span>Findings: ${profile.findings.length}</span>
          </div>
        </div>
        <div class="profile-findings">
          ${profile.findings.length > 0 ? `
            <table class="findings-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                ${profile.findings.map((f) => this.renderFindingRow(f)).join('')}
              </tbody>
            </table>
          ` : '<p class="no-findings">No findings</p>'}
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

    let html = `<section class="section"><h2>Screenshots</h2><div class="screenshots-grid">`;

    for (const screenshot of allScreenshots) {
      html += `
      <div class="screenshot-item">
        <div class="screenshot-header">${screenshot.profile}</div>
        <img src="${screenshot.fileName}" alt="Screenshot from ${screenshot.profile}">
        <div class="screenshot-meta">${new Date(screenshot.timestamp).toLocaleTimeString()}</div>
      </div>`;
    }

    html += `</div></section>`;
    return html;
  }

  private renderFindingRow(finding: Finding): string {
    const severityColor = {
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3',
    };

    return `
    <tr>
      <td><span class="severity-badge" style="background-color: ${severityColor[finding.severity]};">${finding.severity}</span></td>
      <td>${this.escapeHtml(finding.category)}</td>
      <td>${this.escapeHtml(finding.message)}</td>
    </tr>`;
  }

  private renderFooter(): string {
    return `
    <footer class="footer">
      <p>Generated by <strong>HauntView v0.1.0</strong> | ${new Date().toLocaleString()}</p>
      <p>For Kiroween 2026 Hackathon</p>
    </footer>`;
  }

  private getStyles(theme: any): string {
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background-color: var(--bg);
        color: var(--text);
        line-height: 1.6;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        color: white;
        padding: 40px;
        border-radius: 8px;
        margin-bottom: 40px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .header h1 {
        font-size: 2.5em;
        margin-bottom: 10px;
      }

      .subtitle {
        font-size: 1.1em;
        opacity: 0.9;
      }

      .meta {
        display: flex;
        gap: 20px;
        margin: 20px 0;
        font-size: 0.9em;
        opacity: 0.9;
      }

      .meta code {
        background: rgba(0, 0, 0, 0.2);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }

      .status {
        display: flex;
        gap: 20px;
        align-items: center;
        border-left: 4px solid;
        padding-left: 20px;
        margin-top: 20px;
      }

      .status-badge {
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        min-width: 100px;
        text-align: center;
      }

      .toc {
        background: var(--bg-alt);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 40px;
        border-left: 4px solid var(--accent);
      }

      .toc h2 {
        margin-bottom: 15px;
      }

      .toc ul {
        list-style: none;
      }

      .toc li {
        margin: 8px 0;
      }

      .toc a {
        color: var(--accent);
        text-decoration: none;
      }

      .toc a:hover {
        text-decoration: underline;
      }

      .section {
        margin-bottom: 40px;
      }

      .section h2 {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--border);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .summary-card {
        background: var(--bg-alt);
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        border-top: 3px solid var(--accent);
      }

      .summary-value {
        font-size: 2em;
        font-weight: bold;
        color: var(--accent);
      }

      .summary-label {
        font-size: 0.9em;
        color: var(--text-muted);
        margin-top: 5px;
      }

      .findings-breakdown {
        background: var(--bg-alt);
        padding: 20px;
        border-radius: 8px;
      }

      .breakdown-table {
        width: 100%;
        border-collapse: collapse;
      }

      .breakdown-table td {
        padding: 10px;
        border-bottom: 1px solid var(--border);
      }

      .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: bold;
        color: white;
      }

      .badge.error {
        background-color: #f44336;
      }

      .badge.warning {
        background-color: #ff9800;
      }

      .badge.info {
        background-color: #2196F3;
      }

      .finding-group {
        margin-bottom: 30px;
        background: var(--bg-alt);
        padding: 20px;
        border-radius: 8px;
      }

      .finding-group h3 {
        margin-bottom: 15px;
      }

      .severity-error, .severity-error {
        color: #f44336;
      }

      .severity-warning {
        color: #ff9800;
      }

      .severity-info {
        color: #2196F3;
      }

      .severity-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 3px;
        color: white;
        font-size: 0.85em;
        font-weight: bold;
      }

      .findings-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--bg);
      }

      .findings-table thead {
        background: var(--border);
      }

      .findings-table th {
        padding: 12px;
        text-align: left;
        font-weight: bold;
      }

      .findings-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--border);
      }

      .findings-table tbody tr:hover {
        background: var(--bg-alt);
      }

      .profile-card {
        background: var(--bg-alt);
        border-radius: 8px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .profile-header {
        border-left: 4px solid;
        padding: 15px;
        background: var(--bg);
      }

      .profile-header h3 {
        margin-bottom: 10px;
      }

      .profile-meta {
        display: flex;
        gap: 15px;
        font-size: 0.9em;
        color: var(--text-muted);
      }

      .profile-findings {
        padding: 15px;
      }

      .no-findings {
        color: var(--text-muted);
        font-style: italic;
      }

      .screenshots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .screenshot-item {
        background: var(--bg-alt);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .screenshot-header {
        padding: 10px;
        background: var(--border);
        font-weight: bold;
      }

      .screenshot-item img {
        width: 100%;
        display: block;
      }

      .screenshot-meta {
        padding: 10px;
        font-size: 0.85em;
        color: var(--text-muted);
      }

      .footer {
        text-align: center;
        padding: 20px;
        border-top: 1px solid var(--border);
        color: var(--text-muted);
        margin-top: 40px;
      }

      @media (max-width: 768px) {
        .header h1 {
          font-size: 1.8em;
        }

        .meta {
          flex-direction: column;
          gap: 10px;
        }

        .summary-grid {
          grid-template-columns: 1fr 1fr;
        }

        .findings-table {
          font-size: 0.9em;
        }

        .findings-table th,
        .findings-table td {
          padding: 8px 4px;
        }
      }

      @media print {
        body {
          background: white;
        }

        .toc {
          page-break-after: always;
        }

        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  private darkTheme() {
    return {
      primary: '#582696', // Purple
      secondary: '#0F0F14', // Dark
      accent: '#DC6428', // Dark orange
      bg: '#0F0F14',
      bgAlt: '#1a1a22',
      text: '#e0e0e0',
      textMuted: '#999',
      border: '#333',
    };
  }

  private lightTheme() {
    return {
      primary: '#582696',
      secondary: '#f5f5f5',
      accent: '#DC6428',
      bg: '#ffffff',
      bgAlt: '#f9f9f9',
      text: '#333333',
      textMuted: '#666',
      border: '#ddd',
    };
  }

  private getAllFindings(report: TestReport): Finding[] {
    return report.profileResults.flatMap((p) => p.findings);
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

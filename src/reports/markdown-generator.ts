/**
 * Markdown Report Generator - Creates clean Markdown reports
 */

import { TestReport, Finding } from '../types';
import { ReportGenerator, ReportOptions, GeneratedReport } from './types';

interface MarkdownStatistics {
  totalProfiles: number;
  successfulProfiles: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalFindings: number;
}

export class MarkdownReportGenerator implements ReportGenerator {
  async generate(report: TestReport, options: ReportOptions): Promise<GeneratedReport> {
    const content = this.generateMarkdownContent(report, options);
    const filename = `hauntview-report-${new Date().getTime()}.md`;

    return {
      format: 'markdown',
      content,
      filename,
      mimeType: 'text/markdown',
    };
  }

  private generateMarkdownContent(report: TestReport, options: ReportOptions): string {
    const findings = this.getAllFindings(report);
    const statistics = this.calculateStatistics(report);

    let markdown = '';

    markdown += this.renderHeader(report, statistics);
    markdown += this.renderTOC();
    markdown += this.renderExecutiveSummary(report, statistics);
    markdown += this.renderFindingsBySeverity(findings);
    markdown += this.renderFindingsByCategory(findings);
    markdown += this.renderProfileDetails(report);

    if (options.includeScreenshots) {
      markdown += this.renderScreenshots(report);
    }

    markdown += this.renderFooter();

    return markdown;
  }

  private renderHeader(report: TestReport, statistics: MarkdownStatistics): string {
    const passRate = ((statistics.successfulProfiles / statistics.totalProfiles) * 100).toFixed(1);
    const status = statistics.errorCount === 0 ? '✅ PASS' : '❌ ISSUES FOUND';

    return `# 👻 HauntView Testing Report

> Comprehensive Web Testing Analysis

## Report Status: ${status}

**URL:** \`${report.url}\`  
**Generated:** ${new Date(report.startTime).toLocaleString()}  
**Duration:** ${(report.duration / 1000).toFixed(2)}s  

### Quick Stats
- **Pass Rate:** ${passRate}%
- **Profiles Run:** ${statistics.totalProfiles}
- **Profiles Passed:** ${statistics.successfulProfiles}
- **Total Findings:** ${statistics.totalFindings}
  - Errors: ${statistics.errorCount}
  - Warnings: ${statistics.warningCount}
  - Info: ${statistics.infoCount}

---

`;
  }

  private renderTOC(): string {
    return `## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Findings by Severity](#findings-by-severity)
3. [Findings by Category](#findings-by-category)
4. [Profile Details](#profile-details)
5. [Recommendations](#recommendations)

---

`;
  }

  private renderExecutiveSummary(report: TestReport, statistics: MarkdownStatistics): string {
    let markdown = `## Executive Summary

### Overview
This HauntView test report analyzes the website against ${statistics.totalProfiles} testing profiles covering:
- Device compatibility (mobile, tablet, desktop)
- Accessibility standards
- Internationalization support
- Performance metrics
- Browser compatibility

### Results

| Metric | Value |
|--------|-------|
| Total Profiles | ${statistics.totalProfiles} |
| Profiles Passed | ${statistics.successfulProfiles} |
| Total Findings | ${statistics.totalFindings} |
| Errors | ${statistics.errorCount} |
| Warnings | ${statistics.warningCount} |
| Info Messages | ${statistics.infoCount} |

### Key Findings

`;

    if (statistics.errorCount > 0) {
      markdown += `🔴 **${statistics.errorCount} Critical Issues** - Require immediate attention\n\n`;
    }

    if (statistics.warningCount > 0) {
      markdown += `🟡 **${statistics.warningCount} Warnings** - Should be reviewed and fixed\n\n`;
    }

    if (statistics.infoCount > 0) {
      markdown += `ℹ️ **${statistics.infoCount} Info Messages** - Suggestions for improvement\n\n`;
    }

    markdown += `---

`;
    return markdown;
  }

  private renderFindingsBySeverity(findings: Finding[]): string {
    let markdown = `## Findings by Severity

`;

    // Errors
    const errors = findings.filter((f) => f.severity === 'error');
    markdown += this.renderSeveritySection('🔴 Errors', errors, errors.length > 0);

    // Warnings
    const warnings = findings.filter((f) => f.severity === 'warning');
    markdown += this.renderSeveritySection('🟡 Warnings', warnings, warnings.length > 0);

    // Info
    const infos = findings.filter((f) => f.severity === 'info');
    markdown += this.renderSeveritySection('ℹ️ Information', infos, infos.length > 0);

    markdown += `---

`;
    return markdown;
  }

  private renderSeveritySection(title: string, findings: Finding[], hasFindings: boolean): string {
    if (!hasFindings) {
      return `### ${title}

No findings.

`;
    }

    let markdown = `### ${title} (${findings.length})

| Profile | Category | Message |
|---------|----------|---------|
`;

    for (const finding of findings) {
      markdown += `| ${finding.profileId} | ${finding.category} | ${finding.message} |\n`;
    }

    markdown += '\n';
    return markdown;
  }

  private renderFindingsByCategory(findings: Finding[]): string {
    const byCategory = this.groupByCategory(findings);

    let markdown = `## Findings by Category

`;

    for (const [category, items] of Object.entries(byCategory).sort()) {
      const errorCount = items.filter((f) => f.severity === 'error').length;
      const warningCount = items.filter((f) => f.severity === 'warning').length;
      const infoCount = items.filter((f) => f.severity === 'info').length;

      markdown += `### 📂 ${category} (${items.length} total)

| Severity | Count |
|----------|-------|
| 🔴 Error | ${errorCount} |
| 🟡 Warning | ${warningCount} |
| ℹ️ Info | ${infoCount} |

`;

      markdown += `| Profile | Message |\n`;
      markdown += `|---------|----------|\n`;

      for (const finding of items) {
        const severityIcon =
          finding.severity === 'error' ? '🔴' : finding.severity === 'warning' ? '🟡' : 'ℹ️';
        markdown += `| ${severityIcon} ${finding.profileId} | ${finding.message} |\n`;
      }

      markdown += '\n';
    }

    markdown += `---

`;
    return markdown;
  }

  private renderProfileDetails(report: TestReport): string {
    let markdown = `## Profile Details

`;

    for (const profile of report.profileResults) {
      const status = profile.success ? '✅' : '❌';
      const findingCount = profile.findings.length;

      markdown += `### ${status} ${profile.profileName}

**Duration:** ${profile.duration}ms  
**Findings:** ${findingCount}

`;

      if (findingCount === 0) {
        markdown += 'No findings - this profile passed successfully!\n\n';
      } else {
        markdown += `| Severity | Category | Message |\n`;
        markdown += `|----------|----------|----------|\n`;

        for (const finding of profile.findings) {
          const severityIcon =
            finding.severity === 'error' ? '🔴' : finding.severity === 'warning' ? '🟡' : 'ℹ️';
          const plateRef = finding.details?.screenshot
            ? ` ([View Plate](screenshots/${finding.details.screenshot}))`
            : '';
          markdown += `| ${severityIcon} | ${finding.category} | ${finding.message}${plateRef} |\n`;
        }

        markdown += '\n';
      }
    }

    markdown += `---

`;
    return markdown;
  }

  private renderScreenshots(report: TestReport): string {
    const allScreenshots = report.profileResults
      .flatMap((p) => p.screenshots.map((s) => ({ ...s, profile: p.profileName })))
      .filter((s) => s.fileName);

    if (allScreenshots.length === 0) {
      return '';
    }

    let markdown = `## Spirit Photography Apparition Plates

`;

    for (const screenshot of allScreenshots) {
      const src =
        screenshot.fileName.startsWith('screenshots/') ||
        screenshot.fileName.startsWith('http') ||
        screenshot.fileName.startsWith('/')
          ? screenshot.fileName
          : `screenshots/${screenshot.fileName}`;

      markdown += `### ${screenshot.profile}

![Apparition Plate: ${screenshot.profile}](${src})  
*Captured: ${new Date(screenshot.timestamp).toLocaleTimeString()}*

`;
    }

    markdown += `---

`;
    return markdown;
  }

  private renderFooter(): string {
    return `## Recommendations

### High Priority (Errors)
Address all critical errors immediately. These issues impact core functionality or user experience.

### Medium Priority (Warnings)
Review and fix warnings when possible. These represent best practices and accessibility concerns.

### Low Priority (Info)
Consider implementing suggestions from info messages for further optimization.

---

*Generated by **HauntView v0.1.0** | ${new Date().toLocaleString()}*  
*Built for Kiroween 2026 Hackathon*
`;
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
      warningCount: allFindings.filter((f) => f.severity === 'warning').length,
      infoCount: allFindings.filter((f) => f.severity === 'info').length,
      totalFindings: allFindings.length,
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
}

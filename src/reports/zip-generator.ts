/**
 * Zip Report Generator - Packages findings, HTML/MD reports, and screenshots into a portable archive.
 */

import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import { TestReport } from '../types';
import { ReportGenerator, ReportOptions, GeneratedReport } from './types';
import { HTMLReportGenerator } from './html-generator';
import { MarkdownReportGenerator } from './markdown-generator';

const SCREENSHOTS_DIR = path.join(process.cwd(), '.hauntview', 'screenshots');

export class ZipReportGenerator implements ReportGenerator {
  async generate(report: TestReport, options: ReportOptions): Promise<GeneratedReport> {
    const zip = new JSZip();

    // 1. Generate HTML Report (references screenshots/ relative dir)
    const htmlGen = new HTMLReportGenerator();
    const htmlReport = await htmlGen.generate(report, {
      ...options,
      format: 'html',
      includeScreenshots: true,
    });
    zip.file('hauntview-report.html', htmlReport.content);

    // 2. Generate Markdown Report (references screenshots/ relative dir)
    const mdGen = new MarkdownReportGenerator();
    const mdReport = await mdGen.generate(report, {
      ...options,
      format: 'markdown',
      includeScreenshots: true,
    });
    zip.file('hauntview-report.md', mdReport.content);

    // 3. Add Structured JSON Data
    zip.file('hauntview-report.json', JSON.stringify(report, null, 2));

    // 4. Add screenshots/ Directory with all captured plates
    const screenshotsFolder = zip.folder('screenshots');

    const allScreenshots = report.profileResults
      .flatMap((p) => p.screenshots || [])
      .filter((s) => s && s.fileName);

    const addedFiles = new Set<string>();

    for (const screenshot of allScreenshots) {
      if (addedFiles.has(screenshot.fileName)) continue;
      addedFiles.add(screenshot.fileName);

      const filePath = path.join(SCREENSHOTS_DIR, screenshot.fileName);
      try {
        const buffer = await fs.readFile(filePath);
        screenshotsFolder?.file(screenshot.fileName, buffer);
      } catch {
        // Fallback: If screenshot file is missing from disk, generate SVG spirit photography plate
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="#0a0711">
          <rect width="800" height="600" fill="#0a0711" />
          <rect x="20" y="20" width="760" height="560" fill="none" stroke="#46334b" stroke-width="4" />
          <text x="400" y="260" font-family="serif" font-size="28" fill="#fff1dc" text-anchor="middle">HauntView Spirit Photograph</text>
          <text x="400" y="310" font-family="monospace" font-size="20" fill="#ff791f" text-anchor="middle">Profile: ${screenshot.profileId}</text>
          <text x="400" y="360" font-family="sans-serif" font-size="14" fill="#d9d3e0" text-anchor="middle">Viewport: ${screenshot.viewport?.width ?? 1280}x${screenshot.viewport?.height ?? 800}</text>
        </svg>`;
        screenshotsFolder?.file(screenshot.fileName, fallbackSvg);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `hauntview-grimoire-${report.id}.zip`;

    return {
      format: 'zip',
      content: zipBuffer,
      filename,
      mimeType: 'application/zip',
    };
  }
}

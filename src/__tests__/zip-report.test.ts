import { ReportFactory } from '../reports/factory';
import { ZipReportGenerator } from '../reports/zip-generator';
import { TestReport } from '../types';
import JSZip from 'jszip';

describe('ZipReportGenerator & Package Bundling', () => {
  const mockReport: TestReport = {
    id: 'test-run-12345',
    url: 'http://localhost:3000',
    startTime: 1700000000000,
    endTime: 1700000005000,
    duration: 5000,
    summary: {
      totalProfiles: 2,
      successfulProfiles: 1,
      failedProfiles: 1,
      totalFindings: 2,
      canonicalizedFindings: 2,
      findingsBySeverity: { error: 1, warning: 1, info: 0 },
      findingsByCategory: { 'touch-target': 1, contrast: 1 },
    },
    profileResults: [
      {
        profileId: 'mobile-iphone15',
        profileName: 'Mobile - iPhone 15',
        success: true,
        startTime: 1700000000000,
        endTime: 1700000002500,
        duration: 2500,
        metadata: {
          browserEngine: 'chromium',
          browserVersion: '120.0',
          nodeVersion: 'v20.0',
        },
        findings: [
          {
            id: 'find-1',
            profileId: 'mobile-iphone15',
            category: 'touch-target',
            message: 'Button too small (22px)',
            severity: 'warning',
            timestamp: 1700000001000,
            isClassified: true,
            details: { screenshot: 'mobile-iphone15-plate.png' },
          },
        ],
        screenshots: [
          {
            profileId: 'mobile-iphone15',
            url: 'http://localhost:3000',
            viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
            timestamp: 1700000001000,
            hash: 'abc123hash',
            fileName: 'mobile-iphone15-plate.png',
          },
        ],
      },
      {
        profileId: 'a11y-visual',
        profileName: 'A11y: Visual',
        success: false,
        startTime: 1700000002500,
        endTime: 1700000005000,
        duration: 2500,
        metadata: {
          browserEngine: 'chromium',
          browserVersion: '120.0',
          nodeVersion: 'v20.0',
        },
        findings: [
          {
            id: 'find-2',
            profileId: 'a11y-visual',
            category: 'contrast',
            message: 'Insufficient color contrast on headline',
            severity: 'error',
            timestamp: 1700000002000,
            isClassified: true,
            details: { screenshot: 'a11y-visual-plate.png' },
          },
        ],
        screenshots: [
          {
            profileId: 'a11y-visual',
            url: 'http://localhost:3000',
            viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false },
            timestamp: 1700000002000,
            hash: 'def456hash',
            fileName: 'a11y-visual-plate.png',
          },
        ],
      },
    ],
  };

  it('creates ZipReportGenerator from ReportFactory', () => {
    const generator = ReportFactory.createGenerator('zip');
    expect(generator).toBeInstanceOf(ZipReportGenerator);

    const available = ReportFactory.getAvailableFormats();
    expect(available).toContain('zip');
  });

  it('packages HTML, Markdown, JSON, and screenshots into a portable zip archive', async () => {
    const generator = new ZipReportGenerator();
    const result = await generator.generate(mockReport, {
      format: 'zip',
      includeScreenshots: true,
    });

    expect(result.format).toBe('zip');
    expect(result.mimeType).toBe('application/zip');
    expect(result.filename).toBe('hauntview-grimoire-test-run-12345.zip');
    expect(Buffer.isBuffer(result.content)).toBe(true);

    // Unpack and verify zip contents
    const zip = await JSZip.loadAsync(result.content as Buffer);

    expect(zip.file('hauntview-report.html')).not.toBeNull();
    expect(zip.file('hauntview-report.md')).not.toBeNull();
    expect(zip.file('hauntview-report.json')).not.toBeNull();

    // Verify screenshots directory exists with files
    const screenshot1 = zip.file('screenshots/mobile-iphone15-plate.png');
    const screenshot2 = zip.file('screenshots/a11y-visual-plate.png');

    expect(screenshot1).not.toBeNull();
    expect(screenshot2).not.toBeNull();

    // Verify HTML points to screenshots/ relative directory
    const htmlContent = await zip.file('hauntview-report.html')!.async('string');
    expect(htmlContent).toContain('screenshots/mobile-iphone15-plate.png');

    // Verify Markdown points to screenshots/ relative directory
    const mdContent = await zip.file('hauntview-report.md')!.async('string');
    expect(mdContent).toContain('screenshots/mobile-iphone15-plate.png');
  });
});

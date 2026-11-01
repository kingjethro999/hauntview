/**
 * Report Factory - Creates report generators based on format
 */

import { ReportGenerator } from './types';
import { HTMLReportGenerator } from './html-generator';
import { MarkdownReportGenerator } from './markdown-generator';

export class ReportFactory {
  static createGenerator(format: string): ReportGenerator {
    switch (format.toLowerCase()) {
      case 'html':
        return new HTMLReportGenerator();
      case 'markdown':
      case 'md':
        return new MarkdownReportGenerator();
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  static getAvailableFormats(): string[] {
    return ['html', 'markdown', 'json'];
  }

  static getFormatInfo(format: string): { mime: string; extension: string; description: string } {
    const info: Record<string, { mime: string; extension: string; description: string }> = {
      html: {
        mime: 'text/html',
        extension: 'html',
        description: 'Interactive HTML report with styling and charts',
      },
      markdown: {
        mime: 'text/markdown',
        extension: 'md',
        description: 'Clean Markdown format for easy sharing',
      },
      json: {
        mime: 'application/json',
        extension: 'json',
        description: 'Raw JSON data for programmatic access',
      },
    };

    return info[format.toLowerCase()] || info.html;
  }
}

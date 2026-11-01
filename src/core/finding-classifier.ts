/**
 * FindingClassifier - Classifies and canonicalizes findings across profiles
 * Handles finding normalization, deduplication, and categorization
 */

import * as crypto from 'crypto';
import { Finding, ClassificationResult, CacheEntry } from '../types';

interface ClassificationRule {
  pattern: RegExp;
  category: string;
  severity: 'error' | 'warning' | 'info';
  canonical: string;
}

export class FindingClassifier {
  private rules: ClassificationRule[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private seenFindings: Map<string, Finding> = new Map(); // hash -> canonical finding
  private cacheTTL: number = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.initializeClassificationRules();
  }

  /**
   * Classify a finding
   */
  async classify(finding: Finding): Promise<ClassificationResult> {
    // Check cache first
    const cacheKey = this.generateFindingHash(finding);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isCacheExpired(cached)) {
      return {
        originalFinding: finding,
        canonical: cached.finding,
        classifier: 'cache',
        confidence: 1.0,
      };
    }

    // Match against classification rules
    for (const rule of this.rules) {
      if (rule.pattern.test(finding.message)) {
        const canonical: Finding = {
          ...finding,
          category: rule.category,
          severity: rule.severity,
          message: rule.canonical,
          canonicalHash: this.hashFinding(rule.canonical),
        };

        // Store in deduplication index
        this.seenFindings.set(canonical.canonicalHash!, canonical);

        // Cache result
        this.cacheClassification(cacheKey, canonical);

        return {
          originalFinding: finding,
          canonical,
          classifier: 'rule-based',
          confidence: 0.95,
        };
      }
    }

    // If no rule matches, use heuristic classification
    return this.classifyByHeuristic(finding, cacheKey);
  }

  /**
   * Batch classify findings
   */
  async classifyBatch(findings: Finding[]): Promise<ClassificationResult[]> {
    return Promise.all(findings.map((f) => this.classify(f)));
  }

  /**
   * Deduplicate findings
   */
  deduplicateFindings(findings: Finding[]): Finding[] {
    const deduplicated: Finding[] = [];
    const seen = new Set<string>();

    for (const finding of findings) {
      const hash = finding.canonicalHash || this.hashFinding(finding.message);

      if (!seen.has(hash)) {
        seen.add(hash);
        deduplicated.push(finding);
      }
    }

    return deduplicated;
  }

  /**
   * Group findings by category
   */
  groupByCategory(findings: Finding[]): Map<string, Finding[]> {
    const grouped = new Map<string, Finding[]>();

    for (const finding of findings) {
      const category = finding.category || 'uncategorized';

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }

      grouped.get(category)!.push(finding);
    }

    return grouped;
  }

  /**
   * Group findings by severity
   */
  groupBySeverity(findings: Finding[]): Map<string, Finding[]> {
    const grouped = new Map<string, Finding[]>();

    for (const finding of findings) {
      if (!grouped.has(finding.severity)) {
        grouped.set(finding.severity, []);
      }

      grouped.get(finding.severity)!.push(finding);
    }

    return grouped;
  }

  /**
   * Analyze finding trends
   */
  analyzeTrends(
    currentFindings: Finding[],
    previousFindings?: Finding[]
  ): {
    newFindings: Finding[];
    resolvedFindings: Finding[];
    changedFindings: Finding[];
  } {
    if (!previousFindings) {
      return {
        newFindings: currentFindings,
        resolvedFindings: [],
        changedFindings: [],
      };
    }

    const currentHashes = new Set(
      currentFindings.map((f) => f.canonicalHash || this.hashFinding(f.message))
    );
    const previousHashes = new Set(
      previousFindings.map((f) => f.canonicalHash || this.hashFinding(f.message))
    );

    const newFindings = currentFindings.filter(
      (f) => !previousHashes.has(f.canonicalHash || this.hashFinding(f.message))
    );

    const resolvedFindings = previousFindings.filter(
      (f) => !currentHashes.has(f.canonicalHash || this.hashFinding(f.message))
    );

    const changedFindings = currentFindings.filter((f) => {
      const hash = f.canonicalHash || this.hashFinding(f.message);
      if (!previousHashes.has(hash)) return false;

      const prevFinding = previousFindings.find(
        (pf) => (pf.canonicalHash || this.hashFinding(pf.message)) === hash
      );

      return prevFinding && prevFinding.severity !== f.severity;
    });

    return {
      newFindings,
      resolvedFindings,
      changedFindings,
    };
  }

  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Initialize classification rules
   */
  private initializeClassificationRules(): void {
    this.rules = [
      // Accessibility rules
      {
        pattern: /alt.{0,50}text|missing.{0,30}alt/i,
        category: 'accessibility',
        severity: 'error',
        canonical: 'Missing or invalid alt text on image element',
      },
      {
        pattern: /aria.{0,50}label|missing.{0,30}aria.{0,20}label/i,
        category: 'accessibility',
        severity: 'warning',
        canonical: 'Element missing ARIA label',
      },
      {
        pattern: /contrast|wcag|color.{0,30}contrast/i,
        category: 'accessibility',
        severity: 'warning',
        canonical: 'Insufficient color contrast ratio',
      },

      // Performance rules
      {
        pattern: /layout.{0,30}shift|cumulative.{0,30}layout|cls/i,
        category: 'performance',
        severity: 'warning',
        canonical: 'Cumulative Layout Shift detected',
      },
      {
        pattern: /large.{0,30}image|unoptimized.{0,30}image|image.{0,30}size/i,
        category: 'performance',
        severity: 'info',
        canonical: 'Image optimization opportunity detected',
      },

      // Best practices rules
      {
        pattern: /console.{0,50}error|javascript.{0,30}error|uncaught/i,
        category: 'errors',
        severity: 'error',
        canonical: 'JavaScript error in console',
      },
      {
        pattern: /console.{0,50}warn|javascript.{0,30}warning/i,
        category: 'errors',
        severity: 'warning',
        canonical: 'JavaScript warning in console',
      },

      // Security rules
      {
        pattern: /mixed.{0,30}content|http.{0,30}https|insecure/i,
        category: 'security',
        severity: 'error',
        canonical: 'Mixed content (HTTP/HTTPS) detected',
      },

      // Responsive design rules
      {
        pattern: /text.{0,30}small|font.{0,30}size|readability/i,
        category: 'responsive',
        severity: 'warning',
        canonical: 'Text size may be too small for readability',
      },
    ];
  }

  /**
   * Classify by heuristic when no rule matches
   */
  private classifyByHeuristic(finding: Finding, cacheKey: string): ClassificationResult {
    // Infer category from message content
    const category = finding.category || 'general';
    let severity = finding.severity || 'info';

    if (finding.message.toLowerCase().includes('error')) {
      severity = 'error';
    } else if (finding.message.toLowerCase().includes('warning')) {
      severity = 'warning';
    }

    const canonical: Finding = {
      ...finding,
      category,
      severity,
      canonicalHash: this.hashFinding(finding.message),
      isClassified: true,
    };

    this.cacheClassification(cacheKey, canonical);
    return {
      originalFinding: finding,
      canonical,
      classifier: 'heuristic',
      confidence: 0.6,
    };
  }

  /**
   * Generate cache key for a finding
   */
  private generateFindingHash(finding: Finding): string {
    const key = `${finding.profileId}:${finding.message}:${finding.category}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Hash finding message
   */
  private hashFinding(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Cache a classification result
   */
  private cacheClassification(key: string, finding: Finding): void {
    const now = Date.now();
    this.cache.set(key, {
      key,
      finding,
      ttl: this.cacheTTL,
      createdAt: now,
      expiresAt: now + this.cacheTTL,
    });
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    seenFindingsCount: number;
    rulesCount: number;
  } {
    return {
      cacheSize: this.cache.size,
      seenFindingsCount: this.seenFindings.size,
      rulesCount: this.rules.length,
    };
  }
}

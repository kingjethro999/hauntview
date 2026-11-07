/**
 * Basic test to verify types compile
 */

import { Finding, ProfileContext, Viewport } from '../types';

describe('Type Definitions', () => {
  it('should create a valid viewport', () => {
    const viewport: Viewport = {
      width: 1920,
      height: 1080,
      isMobile: false,
      hasTouch: false,
    };

    expect(viewport.width).toBe(1920);
    expect(viewport.height).toBe(1080);
    expect(viewport.isMobile).toBe(false);
  });

  it('should create a valid finding', () => {
    const finding: Finding = {
      id: 'test-1',
      profileId: 'mobile-iphone15',
      severity: 'warning',
      category: 'performance',
      message: 'Test finding',
      timestamp: Date.now(),
      evidence: [{ kind: 'metric', name: 'fixture', value: 1, unit: 'count' }],
      isClassified: false,
    };

    expect(finding.severity).toBe('warning');
    expect(finding.category).toBe('performance');
  });

  it('should create a valid profile context', () => {
    const context: ProfileContext = {
      profileId: 'mobile-iphone15',
      profileName: 'Mobile - iPhone 15',
      viewport: {
        width: 390,
        height: 844,
        isMobile: true,
        hasTouch: true,
      },
      strictMode: false,
    };

    expect(context.viewport.isMobile).toBe(true);
  });
});

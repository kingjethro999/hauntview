/**
 * Unit tests for URL safety boundaries (§4.7).
 *
 * Key rules under test:
 * - https://example.com -> valid (public HTTPS)
 * - http://localhost:3000 allowLocal:true -> valid
 * - http://localhost:3000 allowLocal:false -> invalid
 * - http://10.0.0.1 without HAUNT_ALLOW_PRIVATE -> invalid
 * - http://169.254.169.254 -> always invalid (cloud metadata, unconditional)
 * - http://8.8.8.8 -> valid (public IP)
 * - ftp://example.com -> invalid (wrong scheme)
 */

import { validateTargetUrl, isSafeIp } from '../url-safety';

describe('validateTargetUrl — §4.7 security boundaries', () => {
  const origEnv = process.env.HAUNT_ALLOW_PRIVATE;

  beforeEach(() => {
    delete process.env.HAUNT_ALLOW_PRIVATE;
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.HAUNT_ALLOW_PRIVATE = origEnv;
    } else {
      delete process.env.HAUNT_ALLOW_PRIVATE;
    }
  });

  it('accepts a public HTTPS URL', () => {
    const result = validateTargetUrl('https://example.com');
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe('https://example.com/');
  });

  it('accepts localhost:3000 when allowLocal is true', () => {
    const result = validateTargetUrl('http://localhost:3000', { allowLocal: true });
    expect(result.valid).toBe(true);
  });

  it('rejects localhost:3000 when allowLocal is false', () => {
    const result = validateTargetUrl('http://localhost:3000', { allowLocal: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects RFC 1918 private address without HAUNT_ALLOW_PRIVATE', () => {
    const result = validateTargetUrl('http://10.0.0.1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('blocked');
  });

  it('accepts RFC 1918 private address when HAUNT_ALLOW_PRIVATE=1', () => {
    process.env.HAUNT_ALLOW_PRIVATE = '1';
    const result = validateTargetUrl('http://10.0.0.1');
    expect(result.valid).toBe(true);
  });

  it('always rejects 169.254.169.254 (cloud metadata) regardless of HAUNT_ALLOW_PRIVATE', () => {
    // Without the env var
    expect(validateTargetUrl('http://169.254.169.254').valid).toBe(false);
    expect(validateTargetUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);

    // Even with HAUNT_ALLOW_PRIVATE=1
    process.env.HAUNT_ALLOW_PRIVATE = '1';
    expect(validateTargetUrl('http://169.254.169.254').valid).toBe(false);
  });

  it('accepts a public IP address (8.8.8.8)', () => {
    const result = validateTargetUrl('http://8.8.8.8');
    expect(result.valid).toBe(true);
  });

  it('rejects ftp:// (wrong scheme)', () => {
    const result = validateTargetUrl('ftp://example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('http');
  });
});

describe('isSafeIp — direct IP checks', () => {
  const origEnv = process.env.HAUNT_ALLOW_PRIVATE;

  beforeEach(() => {
    delete process.env.HAUNT_ALLOW_PRIVATE;
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.HAUNT_ALLOW_PRIVATE = origEnv;
    } else {
      delete process.env.HAUNT_ALLOW_PRIVATE;
    }
  });

  it('blocks 169.254.169.254 even when allowLocal=true and HAUNT_ALLOW_PRIVATE=1', () => {
    process.env.HAUNT_ALLOW_PRIVATE = '1';
    expect(isSafeIp('169.254.169.254', true)).toBe(false);
  });

  it('blocks link-local range 169.254.1.1', () => {
    expect(isSafeIp('169.254.1.1', true)).toBe(false);
  });

  it('allows loopback 127.0.0.1 when allowLocal=true', () => {
    expect(isSafeIp('127.0.0.1', true)).toBe(true);
  });

  it('blocks loopback 127.0.0.1 when allowLocal=false', () => {
    expect(isSafeIp('127.0.0.1', false)).toBe(false);
  });

  it('blocks RFC 1918 10.x without HAUNT_ALLOW_PRIVATE', () => {
    expect(isSafeIp('10.0.0.1', true)).toBe(false);
  });

  it('blocks RFC 1918 172.16.x without HAUNT_ALLOW_PRIVATE', () => {
    expect(isSafeIp('172.16.0.1', true)).toBe(false);
  });

  it('blocks RFC 1918 192.168.x without HAUNT_ALLOW_PRIVATE', () => {
    expect(isSafeIp('192.168.1.1', true)).toBe(false);
  });

  it('allows RFC 1918 addresses when HAUNT_ALLOW_PRIVATE=1', () => {
    process.env.HAUNT_ALLOW_PRIVATE = '1';
    expect(isSafeIp('10.0.0.1', true)).toBe(true);
    expect(isSafeIp('172.16.0.1', true)).toBe(true);
    expect(isSafeIp('192.168.1.1', true)).toBe(true);
  });

  it('allows public IP 8.8.8.8', () => {
    expect(isSafeIp('8.8.8.8', true)).toBe(true);
    expect(isSafeIp('8.8.8.8', false)).toBe(true);
  });
});

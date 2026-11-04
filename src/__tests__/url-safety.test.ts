import { validateTargetUrl, isSafeIp } from '../lib/server/url-safety';

describe('URL Safety Layer', () => {
  it('accepts valid public HTTP/HTTPS URLs', () => {
    const result1 = validateTargetUrl('https://example.com');
    expect(result1.valid).toBe(true);
    expect(result1.normalizedUrl).toBe('https://example.com/');

    const result2 = validateTargetUrl('http://subdomain.example.org/path?q=1');
    expect(result2.valid).toBe(true);
  });

  it('rejects unsupported protocols', () => {
    expect(validateTargetUrl('file:///etc/passwd').valid).toBe(false);
    expect(validateTargetUrl('ftp://example.com').valid).toBe(false);
    expect(validateTargetUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateTargetUrl('data:text/html,<h1>Hello</h1>').valid).toBe(false);
  });

  it('rejects URLs with embedded credentials', () => {
    const res = validateTargetUrl('https://user:password@example.com');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('embedded credentials');
  });

  it('allows localhost and loopback in local development mode', () => {
    expect(validateTargetUrl('http://localhost:3000', { allowLocal: true }).valid).toBe(true);
    expect(validateTargetUrl('http://127.0.0.1:8080', { allowLocal: true }).valid).toBe(true);
  });

  it('rejects localhost when allowLocal is false', () => {
    expect(validateTargetUrl('http://localhost:3000', { allowLocal: false }).valid).toBe(false);
    expect(validateTargetUrl('http://127.0.0.1:8080', { allowLocal: false }).valid).toBe(false);
  });

  it('blocks cloud metadata IP 169.254.169.254', () => {
    expect(isSafeIp('169.254.169.254', true)).toBe(false);
    expect(validateTargetUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
  });
});

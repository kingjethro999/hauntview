/**
 * Target URL Safety and SSRF Prevention Layer
 * Validates external and local target URLs before Playwright navigation.
 */

import ipaddr from 'ipaddr.js';
import { z } from 'zod';

export interface UrlSafetyOptions {
  allowLocal?: boolean;
}

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export const TargetUrlSchema = z
  .string()
  .min(1, 'Target URL is required')
  .max(2048, 'URL exceeds maximum length of 2048 characters')
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Only http:// and https:// protocols are supported' }
  )
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    },
    { message: 'URLs containing embedded credentials are not allowed' }
  );

/**
 * Checks if a parsed IP address is safe to contact.
 *
 * Rules (§4.7):
 * - Cloud metadata 169.254.169.254 is ALWAYS blocked regardless of any env or option.
 * - link-local (169.254.x.x), multicast, broadcast, unspecified, and carrierGradeNat
 *   are always blocked.
 * - Loopback (127.x / ::1) is allowed only when allowLocal === true.
 * - Private ranges (RFC 1918: 10.x, 172.16-31.x, 192.168.x) and unique-local IPv6
 *   (fc00::/7) are allowed only when HAUNT_ALLOW_PRIVATE=1 is set in the environment.
 * - All other addresses (public internet) are allowed.
 */
export function isSafeIp(ipString: string, allowLocal = true): boolean {
  if (!ipaddr.isValid(ipString)) {
    return false;
  }

  // Cloud metadata endpoint — unconditionally blocked (§4.7).
  if (ipString === '169.254.169.254') {
    return false;
  }

  const parsed = ipaddr.parse(ipString);
  const range = parsed.range();

  // Always-blocked ranges regardless of any option or env variable.
  const alwaysBlockedRanges = [
    'linkLocal', // covers 169.254.0.0/16 (including cloud metadata)
    'multicast',
    'broadcast',
    'carrierGradeNat',
    'unspecified',
  ];

  if (alwaysBlockedRanges.includes(range)) {
    return false;
  }

  // Unique-local IPv6 (fc00::/7) — treat same as private (§4.7).
  if (parsed.kind() === 'ipv6') {
    const ipv6 = parsed as ipaddr.IPv6;
    // The first byte in fc00::/7 has the top 7 bits set to 1111110x.
    const firstByte = ipv6.parts[0] >> 8; // high byte of first 16-bit part
    const isUniqueLocal = (firstByte & 0xfe) === 0xfc;
    if (isUniqueLocal) {
      return process.env.HAUNT_ALLOW_PRIVATE === '1';
    }
  }

  // Loopback: 127.0.0.0/8 or ::1 — controlled by allowLocal.
  if (range === 'loopback') {
    return allowLocal;
  }

  // Private ranges (RFC 1918): 10.x, 172.16-31.x, 192.168.x — requires env gate.
  if (range === 'private') {
    return process.env.HAUNT_ALLOW_PRIVATE === '1';
  }

  // Public internet address — safe.
  return true;
}

/**
 * Validates target URL against safety policies.
 */
export function validateTargetUrl(
  input: string,
  options: UrlSafetyOptions = { allowLocal: true }
): UrlValidationResult {
  const allowLocal = options.allowLocal ?? true;

  // Schema validation
  const parsedZod = TargetUrlSchema.safeParse(input.trim());
  if (!parsedZod.success) {
    return {
      valid: false,
      error: parsedZod.error.issues[0]?.message || 'Invalid URL format',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { valid: false, error: 'Could not parse URL' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check for localhost or local domains
  const isLocalHostName =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.test');

  if (isLocalHostName) {
    if (!allowLocal) {
      return { valid: false, error: 'Localhost destinations are not allowed in this mode' };
    }
    return { valid: true, normalizedUrl: parsed.toString() };
  }

  // If hostname is an IP address, validate with ipaddr.js
  if (ipaddr.isValid(hostname)) {
    if (!isSafeIp(hostname, allowLocal)) {
      return {
        valid: false,
        error: `IP address ${hostname} is blocked for safety reasons`,
      };
    }
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}

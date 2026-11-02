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
 */
export function isSafeIp(ipString: string, allowLocal = true): boolean {
  if (!ipaddr.isValid(ipString)) {
    return false;
  }

  const parsed = ipaddr.parse(ipString);
  const range = parsed.range();

  // Dangerous or internal metadata ranges that should never be scanned
  const blockedRanges = [
    'linkLocal', // e.g. 169.254.169.254 AWS metadata
    'multicast',
    'broadcast',
    'carrierGradeNat',
    'unspecified',
  ];

  if (blockedRanges.includes(range)) {
    return false;
  }

  // Cloud metadata explicit protection
  if (ipString === '169.254.169.254') {
    return false;
  }

  if (allowLocal) {
    // In local testing mode, loopback and private LAN addresses are permitted (e.g. localhost, 127.0.0.1, 192.168.x.x)
    return true;
  }

  // In restricted public mode, private and loopback are blocked
  return range !== 'loopback' && range !== 'private';
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

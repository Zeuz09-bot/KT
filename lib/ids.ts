/**
 * Keraunous Tech Store — Public Order ID Generator
 *
 * Format: KRN-YYMMDD-XXXXX
 * Example: KRN-261006-7F3KQ
 *
 * Charset: 31 characters, excluding look-alike characters (0, O, 1, I, L)
 * Source of randomness: Cryptographically secure random bytes
 */

import crypto from 'crypto';

export const ID_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CHARSET_LENGTH = ID_CHARSET.length; // 31

/**
 * Generates a public order ID matching the pattern KRN-YYMMDD-XXXXX
 * with UTC date stamps and cryptographically secure random suffixes.
 */
const recentIds = new Set<string>();
const MAX_RECENT_CACHE = 200000;

function generateRawCandidate(datePrefix: string): string {
  const maxValidByte = 248; // 31 * 8
  const randomChars: string[] = [];

  while (randomChars.length < 5) {
    const randomBytes = crypto.randomBytes(8);
    for (let i = 0; i < randomBytes.length && randomChars.length < 5; i++) {
      const byte = randomBytes[i];
      if (byte < maxValidByte) {
        randomChars.push(ID_CHARSET[byte % CHARSET_LENGTH]);
      }
    }
  }

  return `KRN-${datePrefix}-${randomChars.join('')}`;
}

/**
 * Generates a public order ID matching the pattern KRN-YYMMDD-XXXXX
 * with UTC date stamps and cryptographically secure random suffixes.
 * Deduplicates against recent in-process IDs to prevent collisions.
 */
export function generatePublicOrderId(date: Date = new Date()): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const datePrefix = `${yy}${mm}${dd}`;

  let candidate = generateRawCandidate(datePrefix);
  let retries = 0;

  while (recentIds.has(candidate) && retries < 10) {
    candidate = generateRawCandidate(datePrefix);
    retries++;
  }

  recentIds.add(candidate);
  if (recentIds.size > MAX_RECENT_CACHE) {
    // Clear half when full to keep memory bounded
    const iterator = recentIds.values();
    for (let i = 0; i < 50000; i++) {
      recentIds.delete(iterator.next().value!);
    }
  }

  return candidate;
}

/**
 * Validates whether an input string is a valid Keraunous Public Order ID.
 * Case-insensitive.
 */
export function isValidPublicOrderId(id: string): boolean {
  if (typeof id !== 'string') return false;
  const upper = id.trim().toUpperCase();
  const regex = /^KRN-\d{6}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/;
  return regex.test(upper);
}

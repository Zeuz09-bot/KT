/**
 * Keraunous Tech Store — Phone Number Utilities
 *
 * All Nigerian phone numbers are normalized and stored in E.164 (+234...).
 * Display formatted as: 0803 123 4567.
 * Masked formatted as: +23480****4567.
 */

// Matches valid Nigerian mobile lines: 70, 71, 80, 81, 90, 91 prefix
export const NG_PHONE_REGEX = /^\+234[789][01]\d{8}$/;

/**
 * Normalizes user-entered Nigerian phone numbers into strict E.164 format (+234...).
 * Accepts:
 *   - 08031234567 (local 11 digits)
 *   - 8031234567 (10 digits)
 *   - +2348031234567 or 2348031234567 (international)
 *   - +23408070822409 (international with accidental leading zero)
 *   - Numbers with spaces, dashes, dots, or parentheses
 * Throws an Error if invalid.
 */
export function normalizePhoneNg(rawInput: string): string {
  if (typeof rawInput !== 'string') {
    throw new TypeError(`Expected string phone input, got: ${typeof rawInput}`);
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Phone number cannot be empty');
  }

  // Remove whitespace, dashes, dots, parentheses
  let cleaned = trimmed.replace(/[\s\-\.\(\)]/g, '');

  // Handle +2340... or 2340... where user adds a zero after country code
  if (cleaned.startsWith('+2340')) {
    cleaned = '+234' + cleaned.slice(5);
  } else if (cleaned.startsWith('2340')) {
    cleaned = '234' + cleaned.slice(4);
  }

  // Regex to extract the 10-digit mobile core: [789][01]\d{8}
  const match = cleaned.match(/^(?:\+?234|0)?([789][01]\d{8})$/);

  if (!match) {
    throw new Error(
      `Invalid Nigerian mobile phone number: "${rawInput}". Must start with valid network prefix (070, 080, 081, 090, 091).`
    );
  }

  return `+234${match[1]}`;
}

/**
 * Validates whether a phone number is a valid Nigerian mobile phone.
 */
export function validatePhoneNg(rawInput: string): boolean {
  try {
    normalizePhoneNg(rawInput);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats an E.164 Nigerian phone number for local UI display.
 * Example: +2348031234567 -> "0803 123 4567"
 */
export function formatPhoneDisplay(e164Phone: string): string {
  const normalized = normalizePhoneNg(e164Phone);
  // normalized is +234 + 10 digits
  const localCore = normalized.slice(4); // 8031234567
  const part1 = '0' + localCore.slice(0, 3); // 0803
  const part2 = localCore.slice(3, 6); // 123
  const part3 = localCore.slice(6); // 4567
  return `${part1} ${part2} ${part3}`;
}

/**
 * Masks a phone number for privacy compliance in logs, analytics, and admin listings.
 * Example: +2348070822409 -> "+23480****2409"
 */
export function maskPhone(phone: string): string {
  try {
    const normalized = normalizePhoneNg(phone);
    // +2348070822409: +234 (4) + 80 (2) + **** (4) + 2409 (4)
    const prefix = normalized.slice(0, 6); // "+23480"
    const suffix = normalized.slice(-4); // "2409"
    return `${prefix}****${suffix}`;
  } catch {
    // If not a standard format, mask middle
    if (phone.length <= 6) return '****';
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
  }
}

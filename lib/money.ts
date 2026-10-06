/**
 * Keraunous Tech Store — Money Utilities
 *
 * NON-NEGOTIABLE RULE:
 * Money is always an integer number of Naira (no floating point, no kobo fractions in v1).
 * Format only at the UI edge with Intl.NumberFormat('en-NG', ...).
 */

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/**
 * Validates that an amount is a safe, non-negative integer representing Naira.
 * Throws an Error if validation fails.
 */
export function assertIntegerNaira(amount: number): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isInteger(amount)) {
    throw new TypeError(`Money amount must be an integer Naira value, got: ${amount}`);
  }
  if (amount < 0) {
    throw new RangeError(`Money amount must be non-negative, got: ${amount}`);
  }
}

/**
 * Formats an integer Naira amount into standard Nigerian currency string.
 * Example: 1650000 -> "₦1,650,000"
 */
export function formatNgn(amount: number): string {
  assertIntegerNaira(amount);
  return NGN_FORMATTER.format(amount);
}

/**
 * Parses a currency string or raw number string into an integer Naira value.
 * Throws if the parsed value contains decimals or is not a valid integer.
 */
export function parseNgn(input: string): number {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected string input for parseNgn, got: ${typeof input}`);
  }

  const cleaned = input.trim();
  if (!cleaned) {
    throw new Error('Invalid empty string for Naira');
  }

  // Check for decimals
  if (cleaned.includes('.')) {
    throw new Error(`Naira values must be integers without decimal fractions: "${cleaned}"`);
  }

  // Remove currency symbols, commas, spaces
  const digitsOnly = cleaned.replace(/[^0-9-]/g, '');
  if (!digitsOnly || digitsOnly === '-') {
    throw new Error(`Invalid Naira representation: "${cleaned}"`);
  }

  const num = parseInt(digitsOnly, 10);
  assertIntegerNaira(num);
  return num;
}

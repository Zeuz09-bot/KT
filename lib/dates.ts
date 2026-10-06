/**
 * Keraunous Tech Store — Date & Time Utilities
 *
 * All timestamps stored in database as UTC timestamptz.
 * All customer and admin displays formatted in Africa/Lagos (UTC+1, WAT).
 */

const LAGOS_TIMEZONE = 'Africa/Lagos';

function parseInput(input: string | Date): Date {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) {
    throw new TypeError(`Invalid date input: "${input}"`);
  }
  return date;
}

/**
 * Formats a date into "06 Oct 2026" in Africa/Lagos timezone.
 */
export function formatLagosDate(input: string | Date): string {
  const date = parseInput(input);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a timestamp into "06 Oct 2026, 11:15" in Africa/Lagos timezone.
 */
export function formatLagosDateTime(input: string | Date): string {
  const date = parseInput(input);
  const formattedDate = formatLagosDate(date);
  const formattedTime = formatLagosTime(date);
  return `${formattedDate}, ${formattedTime}`;
}

/**
 * Formats time into "11:15" (24-hour) in Africa/Lagos timezone.
 */
export function formatLagosTime(input: string | Date): string {
  const date = parseInput(input);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

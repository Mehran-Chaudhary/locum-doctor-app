import { format, parseISO, differenceInHours, differenceInMinutes, isAfter, isBefore, formatDistanceToNow } from 'date-fns';

/**
 * Format an ISO date string to a user-friendly date.
 * e.g. "Mar 5, 2026"
 */
export function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy');
}

/**
 * Format an ISO date string to a short date (no year).
 * e.g. "Mar 5"
 */
export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

/**
 * Format an ISO date string to time only.
 * e.g. "8:00 PM"
 */
export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

/**
 * Format a shift's start–end range.
 * e.g. "Mar 5, 8:00 PM → Mar 6, 8:00 AM"
 */
export function formatShiftRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  return `${format(s, 'MMM d, h:mm a')} → ${format(e, 'MMM d, h:mm a')}`;
}

/**
 * Format a shift's start–end as compact same-line.
 * e.g. "Mar 5, 8:00 PM – 8:00 AM"
 */
export function formatShiftRangeCompact(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  // Same day
  if (format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd')) {
    return `${format(s, 'MMM d')}, ${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`;
  }
  return `${format(s, 'MMM d, h:mm a')} – ${format(e, 'MMM d, h:mm a')}`;
}

/**
 * Format hours as a readable duration string.
 * e.g. "12 hrs" or "6.5 hrs"
 */
export function formatDuration(hours: number): string {
  if (Number.isInteger(hours)) return `${hours} hrs`;
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Format a PKR amount.
 * e.g. "Rs. 18,000"
 */
export function formatPKR(amount: number | string | null | undefined): string {
  if (amount == null) return 'Rs. 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs. 0';
  return `Rs. ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

/**
 * Format an ISO date as a relative time string.
 * e.g. "2 hours ago", "in 3 days"
 */
export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/**
 * Check whether a date is in the future.
 */
export function isFuture(iso: string): boolean {
  return isAfter(parseISO(iso), new Date());
}

/**
 * Client-side preview calculation: duration in hours between two ISO dates.
 */
export function calcDurationHrs(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  const minutes = differenceInMinutes(e, s);
  return Math.round((minutes / 60) * 100) / 100;
}

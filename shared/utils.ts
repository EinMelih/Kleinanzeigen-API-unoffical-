// Shared utility functions for the Kleinanzeigen API

/**
 * Format date in German timezone (Europe/Berlin)
 * @param date Date to format
 * @returns Formatted date string in German locale
 */
export function formatGermanDate(date: Date): string {
  return date.toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get current time in German timezone
 * @returns Date object adjusted to German timezone
 */
export function getGermanDate(date: Date = new Date()): Date {
  // Convert to German timezone by adjusting the offset
  const germanOffset = 2; // CEST (Central European Summer Time)
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  const germanTime = new Date(utcTime + germanOffset * 3600000);
  return germanTime;
}

/**
 * Convert email to filename-safe slug
 * @param email Email address
 * @returns Filename-safe string
 */
export function emailToSlug(email: string): string {
  return email.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Random delay for human-like behavior
 * @param min Minimum delay in milliseconds
 * @param max Maximum delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function randomDelay(
  min: number = 100,
  max: number = 400
): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Calculate days until expiry
 * @param expiryDate Date of expiry
 * @returns Number of days until expiry (negative if expired)
 */
export function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format duration in human-readable format
 * @param days Number of days
 * @returns Human-readable duration string
 */
export function formatDuration(days: number): string {
  if (days <= 0) {
    return "Expired";
  } else if (days === 1) {
    return "1 day";
  } else if (days < 30) {
    return `${days} days`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  } else {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 year" : `${years} years`;
  }
}

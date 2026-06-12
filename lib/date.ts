import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * The restaurant operates in IST. All "business day" logic must be anchored
 * to Asia/Kolkata regardless of where the server runs (Vercel = UTC).
 */
export const IST_TZ = "Asia/Kolkata";

/** Today's business date in IST as "yyyy-MM-dd" (rolls over at 4:00 AM IST). */
export function todayIST(): string {
  const now = new Date();
  const hoursStr = formatInTimeZone(now, IST_TZ, "H");
  const hours = parseInt(hoursStr, 10);
  
  let dateObj = now;
  if (hours < 4) {
    dateObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  return formatInTimeZone(dateObj, IST_TZ, "yyyy-MM-dd");
}

/** A Date object representing "now" shifted into IST wall-clock time. */
export function nowIST(): Date {
  return toZonedTime(new Date(), IST_TZ);
}

/** "yyyy-MM-dd" for N days before today (IST), using the business date. */
export function daysAgoIST(days: number): string {
  const now = new Date();
  const hoursStr = formatInTimeZone(now, IST_TZ, "H");
  const hours = parseInt(hoursStr, 10);
  
  let dateObj = now;
  if (hours < 4) {
    dateObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  const targetDate = new Date(dateObj.getTime() - days * 24 * 60 * 60 * 1000);
  return formatInTimeZone(targetDate, IST_TZ, "yyyy-MM-dd");
}

/** Human label for a date string, e.g. "Thu, 11 Jun 2026". */
export function formatDateLabel(date: string | Date): string {
  const d = typeof date === "string" ? (date.includes("T") ? new Date(date) : new Date(date + "T00:00:00")) : date;
  return formatInTimeZone(d, IST_TZ, "EEE, dd MMM yyyy");
}

/** Short date label, e.g. "11 Jun". */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? (date.includes("T") ? new Date(date) : new Date(date + "T00:00:00")) : date;
  return formatInTimeZone(d, IST_TZ, "dd MMM");
}

/** Time of a timestamp in IST, e.g. "9:42 PM". */
export function formatTimeIST(ts: string | Date): string {
  return formatInTimeZone(new Date(ts), IST_TZ, "h:mm a");
}

/** Full timestamp in IST, e.g. "11 Jun 2026, 9:42 PM". */
export function formatTimestampIST(ts: string | Date): string {
  return formatInTimeZone(new Date(ts), IST_TZ, "dd MMM yyyy, h:mm a");
}

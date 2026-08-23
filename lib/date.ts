import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { DAY_ROLLOVER_HOUR, SHIFT_END_HOUR } from "@/lib/constants";

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
  if (hours < DAY_ROLLOVER_HOUR) {
    dateObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  return formatInTimeZone(dateObj, IST_TZ, "yyyy-MM-dd");
}

/** A Date object representing "now" shifted into IST wall-clock time. */
export function nowIST(): Date {
  return toZonedTime(new Date(), IST_TZ);
}

/**
 * Has today's business day finished — i.e. is the shift over, so a day with no
 * check-in is genuinely a no-show rather than one still in progress?
 *
 * Attendance must never resolve the current day into CL or LWP before this is
 * true: at 11 AM a staff member who has not scanned yet is simply early, not
 * absent, and marking them unpaid mid-shift is both wrong and visible to them.
 */
export function isTodaySettledIST(): boolean {
  const now = new Date();
  const hour = parseInt(formatInTimeZone(now, IST_TZ, "H"), 10);
  const minute = parseInt(formatInTimeZone(now, IST_TZ, "m"), 10);
  const clock = hour + minute / 60;

  // Between midnight and the 4 AM rollover the business date is still
  // yesterday (see todayIST), and yesterday's shift ended hours ago.
  if (clock < DAY_ROLLOVER_HOUR) return true;

  return clock >= SHIFT_END_HOUR;
}

/** "yyyy-MM-dd" for N days before today (IST), using the business date. */
export function daysAgoIST(days: number): string {
  const now = new Date();
  const hoursStr = formatInTimeZone(now, IST_TZ, "H");
  const hours = parseInt(hoursStr, 10);
  
  let dateObj = now;
  if (hours < DAY_ROLLOVER_HOUR) {
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

/**
 * Every business date from `to` back to `from`, inclusive, newest first.
 *
 * Built on UTC deliberately: `new Date("2026-07-31T00:00:00")` parses in the
 * server's local zone, so calling `.toISOString()` on it shifts the date back
 * a day for any zone ahead of UTC (IST is +5:30). Anchoring to UTC keeps the
 * calendar date stable regardless of where the server runs.
 */
export function datesDescending(from: string, to: string): string[] {
  const start = Date.parse(from + "T00:00:00Z");
  const end = Date.parse(to + "T00:00:00Z");
  if (isNaN(start) || isNaN(end) || end < start) return [];

  const out: string[] = [];
  for (let t = end; t >= start; t -= 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** `days` calendar days before `date` (inclusive window start), as yyyy-MM-dd. */
export function dateMinusDays(date: string, days: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

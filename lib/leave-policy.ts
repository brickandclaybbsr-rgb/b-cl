/**
 * Single source of truth for Brick & Clay's leave policy and monthly attendance
 * maths. Payroll, leave balances and reports all derive from here so they can
 * never disagree — that's what removes the manual month-end calculation.
 *
 * Policy:
 *  - Weekly Off / CL : 4 per month
 *  - Sick Leave      : 6 per YEAR
 *  - LWP             : unpaid, deducted at the daily rate
 *  - Working days    : Mon–Sun (every day is a working day except an approved
 *                      weekly off / leave)
 */

export const CL_PER_MONTH = 4;
export const CL_PER_YEAR = CL_PER_MONTH * 12; // 48
export const SL_PER_YEAR = 6;

export type DayStatus =
  | "present"
  | "cl"      // weekly off / casual leave
  | "sl"      // sick leave
  | "lwp"     // leave without pay (approved, unpaid)
  | "absent"  // no attendance, no approved leave → treated as LWP for pay
  | "future"  // hasn't happened yet — never counted as absent
  | "not_employed"; // before the joining date (mid-month joiner) — pay is pro-rated instead

export interface DayDetail {
  dayNum: number;
  date: string;      // yyyy-MM-dd
  status: DayStatus;
}

export interface LeaveRow {
  leave_type: "cl" | "sl" | "lwp";
  start_date: string;
  end_date: string;
  status?: string;
}

export interface MonthAttendance {
  days: DayDetail[];
  daysInMonth: number;
  /** Days already elapsed this month (all of them for a past month). */
  countedDays: number;
  /**
   * Days in the month the employee was actually employed for. Equals
   * daysInMonth unless they joined (or will join) mid-month — pay is
   * pro-rated by employedDays / daysInMonth.
   */
  employedDays: number;
  presentCount: number;
  clCount: number;
  slCount: number;
  /** Approved LWP days. */
  lwpCount: number;
  /** No attendance and no approved leave. */
  absentCount: number;
  /** Unpaid days = lwp + absent. This is what payroll deducts. */
  unpaidCount: number;
}

/**
 * Build a day-by-day picture of one employee's month.
 *
 * `attendedDates` should be the union of every source that proves presence
 * (QR check-ins and legacy biometric punches).
 *
 * Days after `today` are marked `future` and never counted as absent — without
 * this, generating a payslip mid-month would wrongly deduct for days that
 * haven't happened yet.
 */
export function buildMonthAttendance(opts: {
  year: number;
  monthNum: number;            // 1-12
  today: string;               // yyyy-MM-dd (IST business date)
  leaves: LeaveRow[];          // approved leaves overlapping the month
  attendedDates: Set<string>;  // yyyy-MM-dd with proven attendance
  /** Treat every non-leave day as present (legacy manual overrides). */
  assumePresent?: boolean;
  /** Employee's joining date (yyyy-MM-dd). Days before it are "not employed". */
  joiningDate?: string | null;
}): MonthAttendance {
  const { year, monthNum, today, leaves, attendedDates, assumePresent, joiningDate } = opts;

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const days: DayDetail[] = [];

  let presentCount = 0;
  let clCount = 0;
  let slCount = 0;
  let lwpCount = 0;
  let absentCount = 0;
  let countedDays = 0;
  let employedDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Before the employee joined: not their absence, and not paid either —
    // the basic pay is pro-rated by employedDays instead.
    if (joiningDate && date < joiningDate) {
      days.push({ dayNum: day, date, status: "not_employed" });
      continue;
    }
    employedDays++;

    if (date > today) {
      days.push({ dayNum: day, date, status: "future" });
      continue;
    }
    countedDays++;

    const leave = leaves.find((l) => l.start_date <= date && l.end_date >= date);
    if (leave) {
      const t = leave.leave_type;
      if (t === "cl") clCount++;
      else if (t === "sl") slCount++;
      else lwpCount++;
      days.push({ dayNum: day, date, status: t });
      continue;
    }

    if (attendedDates.has(date) || assumePresent) {
      presentCount++;
      days.push({ dayNum: day, date, status: "present" });
      continue;
    }

    absentCount++;
    days.push({ dayNum: day, date, status: "absent" });
  }

  return {
    days,
    daysInMonth,
    countedDays,
    employedDays,
    presentCount,
    clCount,
    slCount,
    lwpCount,
    absentCount,
    unpaidCount: lwpCount + absentCount,
  };
}

/**
 * Leave balances. CL is a monthly allowance; SL is a yearly one.
 * `slUsedThisYear` should count approved SL days across the whole calendar year.
 */
export function leaveBalances(opts: {
  clUsedThisMonth: number;
  slUsedThisYear: number;
}) {
  return {
    clAllowance: CL_PER_MONTH,
    clUsed: opts.clUsedThisMonth,
    clRemaining: Math.max(0, CL_PER_MONTH - opts.clUsedThisMonth),
    slAllowance: SL_PER_YEAR,
    slUsed: opts.slUsedThisYear,
    slRemaining: Math.max(0, SL_PER_YEAR - opts.slUsedThisYear),
  };
}

/** Inclusive day count between two yyyy-MM-dd dates. */
export function daysBetweenInclusive(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

/** Approved SL days taken in a given calendar year. */
export function sickLeaveUsedInYear(leaves: LeaveRow[], year: number): number {
  return leaves
    .filter((l) => l.leave_type === "sl" && (l.status ?? "approved") === "approved")
    .reduce((total, l) => {
      // Clamp the leave to the year so a Dec–Jan leave counts correctly.
      const start = l.start_date < `${year}-01-01` ? `${year}-01-01` : l.start_date;
      const end = l.end_date > `${year}-12-31` ? `${year}-12-31` : l.end_date;
      return total + daysBetweenInclusive(start, end);
    }, 0);
}

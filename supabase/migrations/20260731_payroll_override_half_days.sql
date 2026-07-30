-- ── Half-day support on payroll overrides ─────────────────────────────────────
-- The leave/attendance tables only store whole days, so a half-day worked had
-- to be hardcoded per employee/month in code (see the June 2026 Manoj case in
-- actions-hr.ts). This lets the owner record them as data instead: a
-- comma-separated list of day numbers that were half days, e.g. "13,18".
-- Each listed day renders as "½" on the attendance calendar; the pay impact
-- is still driven by the present_days / lwp_days override fields.

alter table public.payroll_overrides
  add column if not exists half_days text;

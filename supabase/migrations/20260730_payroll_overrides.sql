-- ── Payroll manual overrides ───────────────────────────────────────────────────
-- Lets the owner directly edit ANY payslip figure from the admin panel — not
-- just payment date/reference. Previously this required hardcoding a
-- name+month exception directly in code (see the June 2026 Biswajeet/Pradosh/
-- Manoj cases in actions-hr.ts) every time computed attendance didn't match
-- reality. One row per (profile, month); leaving a field null means "use the
-- computed value" so most slips need no override at all.

create table if not exists public.payroll_overrides (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  month              text not null,             -- YYYY-MM
  present_days       numeric(4,1),               -- overrides computed present count (supports half-days)
  cl_days            numeric(4,1),
  sl_days            numeric(4,1),
  lwp_days           numeric(4,1),               -- overrides computed LWP/absent count (drives the deduction)
  basic_pay_override numeric(10,2),               -- overrides profiles.basic_pay for this slip only
  extra_duty_amount  numeric(10,2),               -- flat amount, e.g. extra-duty allowance
  extra_duty_label   text,                        -- shown on the earnings line, e.g. "13 days extra duty"
  bonus_amount       numeric(10,2),
  bonus_label        text,
  incentive_amount   numeric(10,2),
  incentive_label    text,
  other_deduction_amount numeric(10,2),
  other_deduction_label  text,
  notes              text,                        -- internal note, not printed on the slip
  updated_by         uuid references public.profiles(id) on delete set null,
  updated_at         timestamptz not null default now(),
  unique (profile_id, month)
);

alter table public.payroll_overrides enable row level security;

drop policy if exists payroll_overrides_select on public.payroll_overrides;
create policy payroll_overrides_select on public.payroll_overrides
  for select using (public.is_owner());

drop policy if exists payroll_overrides_write on public.payroll_overrides;
create policy payroll_overrides_write on public.payroll_overrides
  for all using (public.is_owner()) with check (public.is_owner());

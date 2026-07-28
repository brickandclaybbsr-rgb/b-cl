-- ── Phase 5: link cash-out "Advance" entries to an employee + payroll ─────────
-- Advances logged in the Cash Out module now automatically flow into
-- payroll_advances (and therefore payslips) instead of needing a duplicate
-- manual entry. Matching is by exact staff name (case-insensitive) — see
-- lib/data/advance-linking.ts.

alter table public.cash_expenses
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

alter table public.payroll_advances
  add column if not exists cash_expense_id uuid references public.cash_expenses(id) on delete cascade;

create unique index if not exists payroll_advances_cash_expense_id_key
  on public.payroll_advances (cash_expense_id)
  where cash_expense_id is not null;

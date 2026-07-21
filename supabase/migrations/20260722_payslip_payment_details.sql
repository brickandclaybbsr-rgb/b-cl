-- ── Salary slip payment details ───────────────────────────────────────────────
-- Store the confirmed payment summary on the salary-slip document so it can be
-- surfaced on the employee's profile card without opening the generated file.
-- Populated when a payslip is finalized (see finalizePayslip / generatePayslipInternal).

alter table public.staff_documents
  add column if not exists payment_date      date,
  add column if not exists payment_reference text,
  add column if not exists payment_mode      text,
  add column if not exists amount_paid        numeric(10,2);

-- ── Phase 6: house-helper daily cash payment ledger ───────────────────────────
-- House helpers (profiles.is_house_helper = true) don't use QR attendance or
-- checklists; they're paid small cash amounts day to day. This tracks each
-- payment so a monthly statement (paid vs. remaining) can be generated without
-- manual bookkeeping. Their monthly salary reuses profiles.basic_pay.

create table if not exists public.house_helper_payments (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  date         date not null,
  amount       numeric(10,2) not null check (amount > 0),
  remarks      text,
  recorded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists house_helper_payments_profile_month_idx
  on public.house_helper_payments (profile_id, date);

alter table public.house_helper_payments enable row level security;

drop policy if exists house_helper_payments_select on public.house_helper_payments;
create policy house_helper_payments_select on public.house_helper_payments
  for select using (profile_id = auth.uid() or public.is_owner());

drop policy if exists house_helper_payments_insert on public.house_helper_payments;
create policy house_helper_payments_insert on public.house_helper_payments
  for insert with check (public.is_owner());

drop policy if exists house_helper_payments_delete on public.house_helper_payments;
create policy house_helper_payments_delete on public.house_helper_payments
  for delete using (public.is_owner());

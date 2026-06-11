-- ═══════════════════════════════════════════════════════════════════════════
--  Brick & Clay Ops — Purchases & Reimbursements Migration
--  Run this in the Supabase SQL Editor (Project → SQL → New query).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Purchases Table ──────────────────────────────────────────────────────
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid references public.vendors(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null,
  items        text not null,
  amount       numeric(10,2) not null check (amount >= 0),
  bill_url     text, -- path to uploaded invoice file in public directory
  notes        text,
  purchased_at timestamptz not null default now()
);

-- Enable RLS
alter table public.purchases enable row level security;

-- Purchases Policies
drop policy if exists purchases_select on public.purchases;
create policy purchases_select on public.purchases
  for select using (auth.role() = 'authenticated');

drop policy if exists purchases_insert on public.purchases;
create policy purchases_insert on public.purchases
  for insert with check (submitted_by = auth.uid() or public.is_owner());

drop policy if exists purchases_delete on public.purchases;
create policy purchases_delete on public.purchases
  for delete using (public.is_owner());


-- ── 2. Reimbursements Table ─────────────────────────────────────────────────
create table if not exists public.reimbursements (
  id           uuid primary key default gen_random_uuid(),
  submitted_by uuid references public.profiles(id) on delete cascade,
  amount       numeric(10,2) not null check (amount > 0),
  purpose      text not null,
  receipt_url  text, -- path to uploaded receipt file
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes        text,
  submitted_at timestamptz not null default now(),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz
);

-- Enable RLS
alter table public.reimbursements enable row level security;

-- Reimbursements Policies
drop policy if exists reimbursements_select on public.reimbursements;
create policy reimbursements_select on public.reimbursements
  for select using (submitted_by = auth.uid() or public.is_owner());

drop policy if exists reimbursements_insert on public.reimbursements;
create policy reimbursements_insert on public.reimbursements
  for insert with check (submitted_by = auth.uid() or public.is_owner());

drop policy if exists reimbursements_update on public.reimbursements;
create policy reimbursements_update on public.reimbursements
  for update using (public.is_owner());

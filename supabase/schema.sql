-- ═══════════════════════════════════════════════════════════════════════════
--  Brick & Clay Ops — Database Schema
--  Run this in the Supabase SQL Editor (Project → SQL → New query).
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Profiles (extends auth.users) ──────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  email      text,
  role       text not null default 'staff' check (role in ('owner', 'staff')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
-- If upgrading an existing project, add the column:
alter table public.profiles add column if not exists email text;

-- ── Opening checklists (one per business day) ──────────────────────────────
create table if not exists public.opening_checklists (
  id            uuid primary key default gen_random_uuid(),
  date          date not null unique,
  submitted_by  uuid references public.profiles(id) on delete set null,
  items         jsonb not null default '[]'::jsonb,
  opening_cash  numeric(10,2),
  absent_staff  text,
  notes         text,
  photo_url     text,
  submitted_at  timestamptz not null default now()
);

-- ── Closing checklists (one per business day) ──────────────────────────────
create table if not exists public.closing_checklists (
  id                uuid primary key default gen_random_uuid(),
  date              date not null unique,
  submitted_by      uuid references public.profiles(id) on delete set null,
  items             jsonb not null default '[]'::jsonb,
  closing_cash      numeric(10,2),
  cash_deposited    numeric(10,2),
  discrepancy_notes text,
  notes             text,
  photo_url         text,
  submitted_at      timestamptz not null default now()
);

-- ── Daily sales (one per business day) ─────────────────────────────────────
create table if not exists public.daily_sales (
  id                  uuid primary key default gen_random_uuid(),
  date                date not null unique,
  submitted_by        uuid references public.profiles(id) on delete set null,
  cash_sales          numeric(10,2) not null default 0,
  online_sales        numeric(10,2) not null default 0,
  aggregator_sales    numeric(10,2) not null default 0,
  total_bills         integer not null default 0,
  discount_amount     numeric(10,2) not null default 0,
  complimentary_count integer not null default 0,
  complimentary_value numeric(10,2) not null default 0,
  notes               text,
  submitted_at        timestamptz not null default now()
);

-- ── Stock items (master list) ──────────────────────────────────────────────
create table if not exists public.stock_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Stock snapshots (point-in-time status; latest = current) ───────────────
create table if not exists public.stock_snapshots (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  submitted_by uuid references public.profiles(id) on delete set null,
  items        jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
create index if not exists stock_snapshots_date_idx
  on public.stock_snapshots (date desc, submitted_at desc);

-- ── Vendors (master list) ──────────────────────────────────────────────────
create table if not exists public.vendors (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact         text,
  supply_category text,
  order_days      text,
  is_active       boolean not null default true
);

-- ── Vendor orders ──────────────────────────────────────────────────────────
create table if not exists public.vendor_orders (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid references public.vendors(id) on delete set null,
  raised_by  uuid references public.profiles(id) on delete set null,
  items      text not null,
  urgency    text not null default 'normal' check (urgency in ('normal', 'urgent')),
  status     text not null default 'pending' check (status in ('pending', 'placed', 'received')),
  notes      text,
  raised_at  timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vendor_orders_status_idx
  on public.vendor_orders (status, raised_at desc);

-- ── Checklist item config (owner-editable master list) ─────────────────────
create table if not exists public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('opening', 'closing')),
  section    text not null,
  label      text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

-- ── EOD report log ─────────────────────────────────────────────────────────
create table if not exists public.eod_reports (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  report_text text,
  sent_to     text,
  sent_at     timestamptz not null default now(),
  status      text not null default 'sent' check (status in ('sent', 'failed'))
);

-- ── App settings (key/value: owner WhatsApp number, etc.) ──────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
--  Auth helpers (SECURITY DEFINER to avoid RLS recursion on profiles)
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and is_active = true
  );
$$;

-- Auto-create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep vendor_orders.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vendor_orders_touch on public.vendor_orders;
create trigger vendor_orders_touch
  before update on public.vendor_orders
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.profiles           enable row level security;
alter table public.opening_checklists enable row level security;
alter table public.closing_checklists enable row level security;
alter table public.daily_sales        enable row level security;
alter table public.stock_items        enable row level security;
alter table public.stock_snapshots    enable row level security;
alter table public.vendors            enable row level security;
alter table public.vendor_orders      enable row level security;
alter table public.checklist_items    enable row level security;
alter table public.eod_reports        enable row level security;
alter table public.app_settings       enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_owner());

drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles
  for all using (public.is_owner()) with check (public.is_owner());

-- Generic helper macro pattern, applied per table below.
-- Operational tables: insert/select own; owner sees & manages all.

-- opening_checklists --------------------------------------------------------
drop policy if exists opening_select on public.opening_checklists;
create policy opening_select on public.opening_checklists
  for select using (auth.uid() is not null);
drop policy if exists opening_insert on public.opening_checklists;
create policy opening_insert on public.opening_checklists
  for insert with check (submitted_by = auth.uid() or public.is_owner());
drop policy if exists opening_update on public.opening_checklists;
create policy opening_update on public.opening_checklists
  for update using (public.is_owner());

-- closing_checklists --------------------------------------------------------
drop policy if exists closing_select on public.closing_checklists;
create policy closing_select on public.closing_checklists
  for select using (auth.uid() is not null);
drop policy if exists closing_insert on public.closing_checklists;
create policy closing_insert on public.closing_checklists
  for insert with check (submitted_by = auth.uid() or public.is_owner());
drop policy if exists closing_update on public.closing_checklists;
create policy closing_update on public.closing_checklists
  for update using (public.is_owner());

-- daily_sales ---------------------------------------------------------------
drop policy if exists sales_select on public.daily_sales;
create policy sales_select on public.daily_sales
  for select using (submitted_by = auth.uid() or public.is_owner());
drop policy if exists sales_insert on public.daily_sales;
create policy sales_insert on public.daily_sales
  for insert with check (submitted_by = auth.uid() or public.is_owner());
drop policy if exists sales_update on public.daily_sales;
create policy sales_update on public.daily_sales
  for update using (submitted_by = auth.uid() or public.is_owner());

-- stock_snapshots -----------------------------------------------------------
drop policy if exists stock_snap_select on public.stock_snapshots;
create policy stock_snap_select on public.stock_snapshots
  for select using (submitted_by = auth.uid() or public.is_owner());
drop policy if exists stock_snap_insert on public.stock_snapshots;
create policy stock_snap_insert on public.stock_snapshots
  for insert with check (submitted_by = auth.uid() or public.is_owner());

-- vendor_orders -------------------------------------------------------------
drop policy if exists vorders_select on public.vendor_orders;
create policy vorders_select on public.vendor_orders
  for select using (raised_by = auth.uid() or public.is_owner());
drop policy if exists vorders_insert on public.vendor_orders;
create policy vorders_insert on public.vendor_orders
  for insert with check (raised_by = auth.uid() or public.is_owner());
drop policy if exists vorders_update on public.vendor_orders;
create policy vorders_update on public.vendor_orders
  for update using (raised_by = auth.uid() or public.is_owner());

-- Master lists: all authenticated read, owner writes -----------------------
drop policy if exists stock_items_read on public.stock_items;
create policy stock_items_read on public.stock_items
  for select using (auth.role() = 'authenticated');
drop policy if exists stock_items_write on public.stock_items;
create policy stock_items_write on public.stock_items
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists vendors_read on public.vendors;
create policy vendors_read on public.vendors
  for select using (auth.role() = 'authenticated');
drop policy if exists vendors_write on public.vendors;
create policy vendors_write on public.vendors
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists checklist_items_read on public.checklist_items;
create policy checklist_items_read on public.checklist_items
  for select using (auth.role() = 'authenticated');
drop policy if exists checklist_items_write on public.checklist_items;
create policy checklist_items_write on public.checklist_items
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings
  for select using (auth.role() = 'authenticated');
drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write on public.app_settings
  for all using (public.is_owner()) with check (public.is_owner());

-- eod_reports: owner only (cron uses service role which bypasses RLS) -------
drop policy if exists eod_select on public.eod_reports;
create policy eod_select on public.eod_reports
  for select using (public.is_owner());
drop policy if exists eod_insert on public.eod_reports;
create policy eod_insert on public.eod_reports
  for insert with check (public.is_owner());

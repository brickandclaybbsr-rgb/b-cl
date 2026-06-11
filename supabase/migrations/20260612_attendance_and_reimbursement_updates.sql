-- ═══════════════════════════════════════════════════════════════════════════
--  Brick & Clay Ops — Attendance and Operational Updates Migration
--  Run this in the Supabase SQL Editor (Project → SQL → New query).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Reimbursements Paid Status Fix ────────────────────────────────────────
alter table public.reimbursements drop constraint if exists reimbursements_status_check;
alter table public.reimbursements add constraint reimbursements_status_check check (status in ('pending', 'approved', 'rejected', 'paid'));

-- ── 2. Closing Checklist Stock Field ─────────────────────────────────────────
alter table public.closing_checklists add column if not exists closing_stock_updated boolean not null default false;

-- ── 3. Profiles Biometric Identifiers ────────────────────────────────────────
alter table public.profiles add column if not exists biometric_pin text;
alter table public.profiles add column if not exists biometric_name text;

-- ── 4. Attendance Punches Table ──────────────────────────────────────────────
create table if not exists public.attendance_punches (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles(id) on delete cascade,
  pin          text not null,
  name         text not null,
  date         date not null,
  time         time not null,
  status       text,
  dept_name    text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now(),
  unique(profile_id, date, time)
);

-- Enable RLS
alter table public.attendance_punches enable row level security;

-- Policies for attendance_punches
drop policy if exists attendance_select on public.attendance_punches;
create policy attendance_select on public.attendance_punches
  for select using (profile_id = auth.uid() or public.is_owner());

drop policy if exists attendance_insert on public.attendance_punches;
create policy attendance_insert on public.attendance_punches
  for insert with check (public.is_owner());

drop policy if exists attendance_update on public.attendance_punches;
create policy attendance_update on public.attendance_punches
  for update using (public.is_owner());

drop policy if exists attendance_delete on public.attendance_punches;
create policy attendance_delete on public.attendance_punches
  for delete using (public.is_owner());

-- ── Phase 1: Universal QR registry, outlet assignment, check-out ──────────────
-- Foundation for the Brick & Clay HR/ops ecosystem:
--   1. qr_codes      — typed QR registry so ONE scanner handles every workflow
--   2. profiles.outlet_id — which outlet an employee is assigned to
--   3. attendance_checkins — check-out support

-- ── 1. Typed QR registry ──────────────────────────────────────────────────────
-- Each QR encodes an opaque token. The scanner looks the token up here, reads
-- qr_type, and dispatches to the matching workflow. New QR workflows are added
-- as rows (from the admin panel) — the scanner itself never needs code changes.
create table if not exists public.qr_codes (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,          -- the value encoded in the printed QR
  qr_type     text not null,                 -- 'attendance' | 'review' | 'training' | 'survey' | 'task' | ...
  label       text not null,                 -- human name, e.g. "Shahin Nagar — Attendance"
  action      text,                          -- optional route/action hint, e.g. '/checklist/opening'
  outlet_id   uuid references public.outlets(id) on delete cascade,
  metadata    jsonb not null default '{}'::jsonb,  -- arbitrary future payload
  expires_at  timestamptz,                   -- null = never expires
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists qr_codes_token_idx on public.qr_codes (token);
create index if not exists qr_codes_type_idx  on public.qr_codes (qr_type);

alter table public.qr_codes enable row level security;

-- Any signed-in user may read active QR definitions (needed to resolve a scan).
drop policy if exists qr_codes_select on public.qr_codes;
create policy qr_codes_select on public.qr_codes
  for select to authenticated using (true);

-- Only the owner manages QR codes.
drop policy if exists qr_codes_insert on public.qr_codes;
create policy qr_codes_insert on public.qr_codes
  for insert to authenticated with check (public.is_owner());

drop policy if exists qr_codes_update on public.qr_codes;
create policy qr_codes_update on public.qr_codes
  for update to authenticated using (public.is_owner());

drop policy if exists qr_codes_delete on public.qr_codes;
create policy qr_codes_delete on public.qr_codes
  for delete to authenticated using (public.is_owner());

-- Backfill: register every existing outlet QR using its EXISTING token, so all
-- already-printed outlet QR codes keep working unchanged.
insert into public.qr_codes (token, qr_type, label, outlet_id, is_active)
select o.qr_token, 'attendance', o.name || ' — Attendance', o.id, o.is_active
from public.outlets o
where not exists (select 1 from public.qr_codes q where q.token = o.qr_token);


-- ── 2. Outlet assignment on profiles ──────────────────────────────────────────
-- Employees mark attendance at their assigned outlet. Null = unassigned, which
-- (per policy below) is treated as "may use any outlet".
alter table public.profiles
  add column if not exists outlet_id uuid references public.outlets(id) on delete set null;

-- Staff who are paid daily in cash and don't use the app (house helpers) are
-- excluded from QR attendance and checklists entirely.
alter table public.profiles
  add column if not exists is_house_helper boolean not null default false;


-- ── 3. Check-out support ──────────────────────────────────────────────────────
alter table public.attendance_checkins
  add column if not exists checked_out_at    timestamptz,
  add column if not exists checkout_latitude  double precision,
  add column if not exists checkout_longitude double precision,
  add column if not exists checkout_distance_m numeric(10,2);

-- Staff update their own row when checking out (insert policy already exists).
drop policy if exists attendance_checkins_update on public.attendance_checkins;
create policy attendance_checkins_update on public.attendance_checkins
  for update to authenticated
  using (profile_id = auth.uid() or public.is_owner())
  with check (profile_id = auth.uid() or public.is_owner());

-- ── QR + geofence attendance ──────────────────────────────────────────────────
-- Staff must scan an outlet's QR code AND be physically within its geofence to
-- check in for the day. Until they do (from the rollout date), the app is locked.

-- ── 1. outlets ────────────────────────────────────────────────────────────────
create table if not exists public.outlets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  qr_token    text not null unique,           -- opaque value encoded in the printed QR
  latitude    double precision not null,
  longitude   double precision not null,
  radius_m    integer not null default 150 check (radius_m > 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.outlets enable row level security;

-- Any signed-in user may read active outlets (needed to validate a scanned token).
drop policy if exists outlets_select on public.outlets;
create policy outlets_select on public.outlets
  for select to authenticated using (true);

-- Only the owner manages outlets.
drop policy if exists outlets_insert on public.outlets;
create policy outlets_insert on public.outlets
  for insert to authenticated with check (public.is_owner());

drop policy if exists outlets_update on public.outlets;
create policy outlets_update on public.outlets
  for update to authenticated using (public.is_owner());

drop policy if exists outlets_delete on public.outlets;
create policy outlets_delete on public.outlets
  for delete to authenticated using (public.is_owner());


-- ── 2. attendance_checkins ────────────────────────────────────────────────────
create table if not exists public.attendance_checkins (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  outlet_id     uuid references public.outlets(id) on delete set null,
  date          date not null,                 -- IST business date
  checked_in_at timestamptz not null default now(),
  latitude      double precision,
  longitude     double precision,
  distance_m    numeric(10,2),                 -- distance from outlet at check-in
  created_at    timestamptz not null default now(),
  unique (profile_id, date)                     -- one check-in per person per day
);

alter table public.attendance_checkins enable row level security;

-- Users see their own check-ins; owner sees everyone's.
drop policy if exists attendance_checkins_select on public.attendance_checkins;
create policy attendance_checkins_select on public.attendance_checkins
  for select to authenticated
  using (profile_id = auth.uid() or public.is_owner());

-- Users create only their own check-in row.
drop policy if exists attendance_checkins_insert on public.attendance_checkins;
create policy attendance_checkins_insert on public.attendance_checkins
  for insert to authenticated
  with check (profile_id = auth.uid());

-- Only the owner may remove/adjust check-ins.
drop policy if exists attendance_checkins_delete on public.attendance_checkins;
create policy attendance_checkins_delete on public.attendance_checkins
  for delete to authenticated using (public.is_owner());

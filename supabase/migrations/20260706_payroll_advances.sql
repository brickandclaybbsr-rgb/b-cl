-- ── 1. payroll_advances table ─────────────────────────────────────────────────
create table if not exists public.payroll_advances (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  month        text not null,           -- YYYY-MM, e.g. '2026-06'
  amount       numeric(10,2) not null check (amount > 0),
  notes        text,
  advance_date date,                    -- optional exact date of payment
  recorded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Enable RLS
alter table public.payroll_advances enable row level security;

-- Policies
drop policy if exists payroll_advances_select on public.payroll_advances;
create policy payroll_advances_select on public.payroll_advances
  for select using (profile_id = auth.uid() or public.is_owner());

drop policy if exists payroll_advances_insert on public.payroll_advances;
create policy payroll_advances_insert on public.payroll_advances
  for insert with check (public.is_owner());

drop policy if exists payroll_advances_delete on public.payroll_advances;
create policy payroll_advances_delete on public.payroll_advances
  for delete using (public.is_owner());

drop policy if exists payroll_advances_update on public.payroll_advances;
create policy payroll_advances_update on public.payroll_advances
  for update using (public.is_owner());


-- ── 2. Add is_visible_to_staff to staff_documents ─────────────────────────────
alter table public.staff_documents
  add column if not exists is_visible_to_staff boolean not null default false;


-- ── 3. Seed known advance data ────────────────────────────────────────────────
-- Manoj Naik - June 27, 2026 - ₹5,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('05b34e46-55cb-4696-a467-3b646022bb8e', '2026-06', 5000, 'Advance', '2026-06-27');

-- Sandeep Nayak - June 27, 2026 - ₹6,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('2283605b-a28c-4ca0-a18a-b206918ef57a', '2026-06', 6000, 'Advance', '2026-06-27');

-- Biswajeet Kandi - June 25, 2026 - ₹5,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('55cec968-39ca-4725-abff-2d0c58682889', '2026-06', 5000, 'Advance', '2026-06-25');

-- Biswajeet Kandi - July 6, 2026 - ₹1,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('55cec968-39ca-4725-abff-2d0c58682889', '2026-07', 1000, 'Advance', '2026-07-06');

-- Ramahari Pradhan - July 1, 2026 - ₹7,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('4c5f3d3c-e602-4ede-aec9-66af32e69fa9', '2026-07', 7000, 'Advance', '2026-07-01');

-- Pradosh Ray - July 1, 2026 - ₹7,000
insert into public.payroll_advances (profile_id, month, amount, notes, advance_date)
values ('efa073b0-63ab-45bb-8b78-5f85b8be0af3', '2026-07', 7000, 'Advance', '2026-07-01');


-- ── 1. Staff Documents Table ──────────────────────────────────────────────
create table if not exists public.staff_documents (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  type         text not null check (type in ('appointment_letter', 'salary_slip')),
  month        text, -- YYYY-MM for salary slips, NULL for appointment letters
  file_url     text not null, -- path to uploaded file, e.g., /uploads/documents/filename.pdf
  file_name    text not null, -- original filename
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.staff_documents enable row level security;

-- Policies for staff_documents
drop policy if exists staff_documents_select on public.staff_documents;
create policy staff_documents_select on public.staff_documents
  for select using (profile_id = auth.uid() or public.is_owner());

drop policy if exists staff_documents_insert on public.staff_documents;
create policy staff_documents_insert on public.staff_documents
  for insert with check (public.is_owner());

drop policy if exists staff_documents_delete on public.staff_documents;
create policy staff_documents_delete on public.staff_documents
  for delete using (public.is_owner());


-- ── 2. Leaves Table ────────────────────────────────────────────────────────
create table if not exists public.leaves (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  leave_type   text not null check (leave_type in ('cl', 'sl', 'lwp')),
  start_date   date not null,
  end_date     date not null,
  reason       text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes        text, -- Rejection reason or manager notes
  submitted_at timestamptz not null default now(),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamptz,
  constraint check_dates check (start_date <= end_date)
);

-- Enable RLS
alter table public.leaves enable row level security;

-- Policies for leaves
drop policy if exists leaves_select on public.leaves;
create policy leaves_select on public.leaves
  for select using (profile_id = auth.uid() or public.is_owner());

drop policy if exists leaves_insert on public.leaves;
create policy leaves_insert on public.leaves
  for insert with check (profile_id = auth.uid());

drop policy if exists leaves_update on public.leaves;
create policy leaves_update on public.leaves
  for update using (public.is_owner());

drop policy if exists leaves_delete on public.leaves;
create policy leaves_delete on public.leaves
  for delete using (profile_id = auth.uid() and status = 'pending');

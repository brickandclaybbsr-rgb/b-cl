-- ── Multi-outlet daily records ────────────────────────────────────────────────
--
-- Until now the business ran from one outlet, so the daily operational tables
-- were keyed by date alone (sales) or date+team (checklists): exactly one set
-- of figures per business day.
--
-- With Saheed Nagar and Patia both trading that no longer holds. Two front
-- desk staff submitting a closing balance on the same day collide on the
-- unique index — one outlet's cash figure overwrites or rejects the other's.
-- This makes every daily record belong to an outlet.
--
-- Safe to run BEFORE the matching app deploy: outlet_id defaults to Saheed
-- Nagar, so an older build that does not send the column still writes a valid
-- row rather than erroring.
--
-- Every statement is idempotent — if a run fails part way, fix the cause and
-- run the whole file again. There is deliberately no BEGIN/COMMIT wrapper, so
-- a failure stops at the offending statement and the editor shows you which
-- one, instead of silently rolling back the column adds with it.
--
-- NOTE ON KEYS: closing_checklists and opening_checklists both carry a `team`
-- column and legitimately hold one row per team per day (kitchen and front
-- desk each submit). Their uniqueness is (date, team, outlet_id). Only
-- daily_sales is one row per outlet per day.

-- ── 1. Add outlet_id, defaulted to Saheed Nagar ──────────────────────────────
-- Literal id rather than a lookup: this migration targets this one database,
-- and a hardcoded value keeps the file plain SQL that fails legibly.

alter table public.opening_checklists
  add column if not exists outlet_id uuid not null
  default 'e840db26-9c52-4212-a484-2b41175646f0'::uuid
  references public.outlets(id) on delete restrict;

alter table public.closing_checklists
  add column if not exists outlet_id uuid not null
  default 'e840db26-9c52-4212-a484-2b41175646f0'::uuid
  references public.outlets(id) on delete restrict;

alter table public.daily_sales
  add column if not exists outlet_id uuid not null
  default 'e840db26-9c52-4212-a484-2b41175646f0'::uuid
  references public.outlets(id) on delete restrict;

alter table public.cash_expenses
  add column if not exists outlet_id uuid not null
  default 'e840db26-9c52-4212-a484-2b41175646f0'::uuid
  references public.outlets(id) on delete restrict;

-- Existing rows predate both outlets, so they all belong to Saheed Nagar.
-- The default covers rows added above, but this catches any that were created
-- nullable by an earlier partial run.
update public.opening_checklists set outlet_id = 'e840db26-9c52-4212-a484-2b41175646f0'::uuid where outlet_id is null;
update public.closing_checklists set outlet_id = 'e840db26-9c52-4212-a484-2b41175646f0'::uuid where outlet_id is null;
update public.daily_sales        set outlet_id = 'e840db26-9c52-4212-a484-2b41175646f0'::uuid where outlet_id is null;
update public.cash_expenses      set outlet_id = 'e840db26-9c52-4212-a484-2b41175646f0'::uuid where outlet_id is null;

-- ── 2. Re-key uniqueness per outlet ──────────────────────────────────────────
-- Drop every shape these keys have taken across earlier migrations, then
-- recreate them with outlet_id included.

alter table public.opening_checklists drop constraint if exists opening_checklists_date_key;
drop index if exists public.opening_checklists_date_team_key;
create unique index if not exists opening_checklists_date_team_outlet_key
  on public.opening_checklists (date, team, outlet_id);

-- (date, TEAM, outlet) — kitchen and front desk each file their own closing
-- checklist, so six dates in June/July already hold two rows apiece.
alter table public.closing_checklists drop constraint if exists closing_checklists_date_key;
drop index if exists public.closing_checklists_date_team_key;
create unique index if not exists closing_checklists_date_team_outlet_key
  on public.closing_checklists (date, team, outlet_id);

-- Sales really are one row per outlet per day.
alter table public.daily_sales drop constraint if exists daily_sales_date_key;
create unique index if not exists daily_sales_date_outlet_key
  on public.daily_sales (date, outlet_id);

-- ── 3. Lookups are almost always "this outlet, this date range" ──────────────
create index if not exists opening_checklists_outlet_date_idx on public.opening_checklists (outlet_id, date desc);
create index if not exists closing_checklists_outlet_date_idx on public.closing_checklists (outlet_id, date desc);
create index if not exists daily_sales_outlet_date_idx        on public.daily_sales (outlet_id, date desc);
create index if not exists cash_expenses_outlet_date_idx      on public.cash_expenses (outlet_id, date desc);

-- ── Verification ─────────────────────────────────────────────────────────────
-- Expect: every row attributed, and no duplicate keys.
--   select 'opening' t, outlet_id, count(*) from public.opening_checklists group by 1,2
--   union all select 'closing', outlet_id, count(*) from public.closing_checklists group by 1,2
--   union all select 'sales',   outlet_id, count(*) from public.daily_sales        group by 1,2
--   union all select 'expenses',outlet_id, count(*) from public.cash_expenses      group by 1,2;

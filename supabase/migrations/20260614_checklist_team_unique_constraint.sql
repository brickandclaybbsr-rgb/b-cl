-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: ensure checklist unique constraint allows one record per team per day
--
-- Uses CREATE UNIQUE INDEX IF NOT EXISTS — natively idempotent, no DO blocks
-- needed. Safe to re-run any number of times.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── opening_checklists ──────────────────────────────────────────────────────

ALTER TABLE public.opening_checklists
  ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'all';

-- Drop the old single-date unique constraint if still present
ALTER TABLE public.opening_checklists
  DROP CONSTRAINT IF EXISTS opening_checklists_date_key;

-- Create the composite unique index (IF NOT EXISTS = skip silently if done)
CREATE UNIQUE INDEX IF NOT EXISTS opening_checklists_date_team_key
  ON public.opening_checklists (date, team);

-- ── closing_checklists ──────────────────────────────────────────────────────

ALTER TABLE public.closing_checklists
  ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'all';

ALTER TABLE public.closing_checklists
  DROP CONSTRAINT IF EXISTS closing_checklists_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS closing_checklists_date_team_key
  ON public.closing_checklists (date, team);

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('opening_checklists', 'closing_checklists')
  AND indexname LIKE '%date_team%';

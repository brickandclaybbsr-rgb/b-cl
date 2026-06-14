-- ═══════════════════════════════════════════════════════════════════════
-- Checklist team migration
-- Adds a `team` column so kitchen and front-desk can each submit their
-- own checklist section independently per day.
--
-- Run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add `team` column ─────────────────────────────────────────────
ALTER TABLE opening_checklists ADD COLUMN IF NOT EXISTS team text;
ALTER TABLE closing_checklists  ADD COLUMN IF NOT EXISTS team text;

-- ── 2. Back-fill: infer team from the submitter's profile ────────────
-- Staff who have a team assignment get that team; others fall back to 'all'.
UPDATE opening_checklists oc
SET team = COALESCE(p.team, 'all')
FROM profiles p
WHERE oc.submitted_by = p.id AND oc.team IS NULL;

-- Rows with no submitted_by (unlikely) fall back to 'all'
UPDATE opening_checklists SET team = 'all' WHERE team IS NULL;

UPDATE closing_checklists cc
SET team = COALESCE(p.team, 'all')
FROM profiles p
WHERE cc.submitted_by = p.id AND cc.team IS NULL;

UPDATE closing_checklists SET team = 'all' WHERE team IS NULL;

-- ── 3. Make column NOT NULL ──────────────────────────────────────────
ALTER TABLE opening_checklists ALTER COLUMN team SET NOT NULL;
ALTER TABLE closing_checklists  ALTER COLUMN team SET NOT NULL;

-- ── 4. Drop old unique constraint on (date) alone ───────────────────
--   If the constraint has a different name in your project, find it with:
--   SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_name = 'opening_checklists' AND constraint_type = 'UNIQUE';
ALTER TABLE opening_checklists DROP CONSTRAINT IF EXISTS opening_checklists_date_key;
ALTER TABLE closing_checklists  DROP CONSTRAINT IF EXISTS closing_checklists_date_key;

-- ── 5. New unique constraint: one record per (date, team) ────────────
CREATE UNIQUE INDEX IF NOT EXISTS opening_checklists_date_team_key
  ON opening_checklists (date, team);

CREATE UNIQUE INDEX IF NOT EXISTS closing_checklists_date_team_key
  ON closing_checklists (date, team);

COMMIT;

-- Verify:
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('opening_checklists', 'closing_checklists')
  AND constraint_type = 'UNIQUE';

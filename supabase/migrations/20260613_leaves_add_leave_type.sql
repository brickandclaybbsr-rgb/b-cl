-- Add leave_type column to existing leaves table if it wasn't created
-- with the original migration (which used CREATE TABLE IF NOT EXISTS and
-- would have been skipped if the table already existed).

ALTER TABLE public.leaves
  ADD COLUMN IF NOT EXISTS leave_type text
    CHECK (leave_type IN ('cl', 'sl', 'lwp'));

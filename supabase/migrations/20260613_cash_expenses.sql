-- Cash expense / petty cash log
-- Staff (front desk) records cash given out: who received it, how much, why.

CREATE TABLE IF NOT EXISTS public.cash_expenses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date        NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')::date,
  person_name   text        NOT NULL,
  amount        numeric(10,2) NOT NULL CHECK (amount > 0),
  category      text        NOT NULL DEFAULT 'withdrawal'
                  CHECK (category IN ('withdrawal', 'advance', 'expense', 'other')),
  notes         text,
  submitted_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at  timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cash_expenses ENABLE ROW LEVEL SECURITY;

-- Staff can insert their own entries
CREATE POLICY "Staff can insert cash expenses"
  ON public.cash_expenses FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Staff can view all entries (so they can see today's list)
CREATE POLICY "Staff can view cash expenses"
  ON public.cash_expenses FOR SELECT TO authenticated
  USING (true);

-- Owner can delete entries
CREATE POLICY "Owner can delete cash expenses"
  ON public.cash_expenses FOR DELETE TO authenticated
  USING (public.is_owner());

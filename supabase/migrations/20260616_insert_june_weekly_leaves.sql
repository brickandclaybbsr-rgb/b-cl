-- Insert approved Weekly Leave (CL) records for June 2026
-- Pradosh: 1 Jun, 10 Jun (two separate single-day leaves)
INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at, processed_at)
SELECT id, 'cl', '2026-06-01', '2026-06-01', 'Weekly off', 'approved', now(), now()
FROM public.profiles WHERE name ILIKE 'Pradosh%' AND is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at, processed_at)
SELECT id, 'cl', '2026-06-10', '2026-06-10', 'Weekly off', 'approved', now(), now()
FROM public.profiles WHERE name ILIKE 'Pradosh%' AND is_active = true
ON CONFLICT DO NOTHING;

-- Sandeep Nayak: 2 Jun – 4 Jun
INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at, processed_at)
SELECT id, 'cl', '2026-06-02', '2026-06-04', 'Weekly off', 'approved', now(), now()
FROM public.profiles WHERE name ILIKE 'Sandeep Nayak%' OR name ILIKE 'Saneep Nayak%' AND is_active = true
ON CONFLICT DO NOTHING;

-- Manoj: 14 Jun – 15 Jun
INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at, processed_at)
SELECT id, 'cl', '2026-06-14', '2026-06-15', 'Weekly off', 'approved', now(), now()
FROM public.profiles WHERE name ILIKE 'Manoj%' AND is_active = true
ON CONFLICT DO NOTHING;

-- Biswajeet Kandi: 5 Jun
INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at, processed_at)
SELECT id, 'cl', '2026-06-05', '2026-06-05', 'Weekly off', 'approved', now(), now()
FROM public.profiles WHERE name ILIKE 'Biswajeet%' AND is_active = true
ON CONFLICT DO NOTHING;

-- Ramharai: no leaves this period (no action needed)

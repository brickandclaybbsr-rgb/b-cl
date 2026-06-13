-- ═══════════════════════════════════════════════════════════════════════
-- Re-import attendance punches from 10_StandardReport.xls (Att.log report)
-- Period: 2026-06-01 to 2026-06-13
-- Step 1: Delete all existing punches for this date range
-- Step 2: Insert correct punches from biometric report
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── STEP 1: Clear existing punches for June 1–13 ──────────────────────
DELETE FROM attendance_punches
WHERE date >= '2026-06-01' AND date <= '2026-06-13';

-- ── STEP 2: Insert correct punches ────────────────────────────────────
-- Profile lookup uses biometric_pin where set, falls back to name match.
-- status: C/In = punch-in, C/Out = punch-out (standard biometric codes).

INSERT INTO attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES

-- ══ SURYA (biometric ID 1) ════════════════════════════════════════════
((SELECT id FROM profiles WHERE biometric_pin='1' OR name ILIKE 'Surya%' LIMIT 1),
 '1','Surya','2026-06-10','11:54','C/In','Brickandclay'),

-- ══ PRADOSH (biometric ID 2) ══════════════════════════════════════════
-- 2026-06-01
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-01','14:02','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-01','23:28','C/Out','Brickandclay'),
-- 2026-06-02
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-02','11:09','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-02','21:54','C/Out','Brickandclay'),
-- 2026-06-03
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-03','14:25','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-03','23:30','C/Out','Brickandclay'),
-- 2026-06-04
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-04','11:50','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-04','23:46','C/Out','Brickandclay'),
-- 2026-06-05
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-05','12:12','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-05','23:45','C/Out','Brickandclay'),
-- 2026-06-06 (in only)
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-06','14:07','C/In','Brickandclay'),
-- 2026-06-07
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-07','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-07','23:11','C/Out','Brickandclay'),
-- 2026-06-08
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-08','11:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-08','19:09','C/Out','Brickandclay'),
-- 2026-06-10 (in only)
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-10','13:56','C/In','Brickandclay'),
-- 2026-06-11
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-11','13:58','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-11','23:48','C/Out','Brickandclay'),
-- 2026-06-12 (in only)
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-12','13:24','C/In','Brickandclay'),

-- ══ RAMAHARI (biometric ID 6) ═════════════════════════════════════════
-- 2026-06-01
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-01','10:35','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-01','23:28','C/Out','Brickandclay'),
-- 2026-06-02
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-02','09:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-02','23:59','C/Out','Brickandclay'),
-- 2026-06-03
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-03','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-03','23:27','C/Out','Brickandclay'),
-- 2026-06-04
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-04','13:55','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-04','23:45','C/Out','Brickandclay'),
-- 2026-06-05
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-05','10:26','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-05','23:45','C/Out','Brickandclay'),
-- 2026-06-06 (4 punches — break in middle)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','10:23','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','14:47','C/Out','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','17:55','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','23:30','C/Out','Brickandclay'),
-- 2026-06-07
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','11:34','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','23:12','C/Out','Brickandclay'),
-- 2026-06-08
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-08','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-08','23:20','C/Out','Brickandclay'),
-- 2026-06-09
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-09','11:08','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-09','23:23','C/Out','Brickandclay'),
-- 2026-06-10 (in only)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-10','11:13','C/In','Brickandclay'),
-- 2026-06-11 (4 punches — break in middle)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-11','11:13','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-11','15:23','C/Out','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-11','18:15','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-11','23:47','C/Out','Brickandclay'),
-- 2026-06-12 (in only)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-12','10:53','C/In','Brickandclay'),

-- ══ SANDEEP / sande (biometric ID 8) ═════════════════════════════════
-- 2026-06-04
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-04','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-04','23:46','C/Out','Brickandclay'),
-- 2026-06-05
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-05','14:10','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-05','23:46','C/Out','Brickandclay'),
-- 2026-06-06 (in only)
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-06','14:07','C/In','Brickandclay'),
-- 2026-06-07
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-07','12:17','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-07','23:10','C/Out','Brickandclay'),
-- 2026-06-08
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-08','13:59','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-08','23:03','C/Out','Brickandclay'),
-- 2026-06-09
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-09','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-09','23:21','C/Out','Brickandclay'),
-- 2026-06-10
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-10','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-10','23:33','C/Out','Brickandclay'),
-- 2026-06-11
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-11','13:57','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-11','23:48','C/Out','Brickandclay'),
-- 2026-06-12 (in only)
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-12','13:57','C/In','Brickandclay'),

-- ══ MANOJ (biometric ID 9) ════════════════════════════════════════════
-- 2026-06-01
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-01','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-01','23:28','C/Out','Brickandclay'),
-- 2026-06-02
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-02','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-02','23:57','C/Out','Brickandclay'),
-- 2026-06-03
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-03','14:25','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-03','23:27','C/Out','Brickandclay'),
-- 2026-06-04
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-04','11:50','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-04','23:45','C/Out','Brickandclay'),
-- 2026-06-05
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-05','14:10','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-05','23:44','C/Out','Brickandclay'),
-- 2026-06-06
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-06','14:07','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-06','23:26','C/Out','Brickandclay'),
-- 2026-06-07
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-07','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-07','23:10','C/Out','Brickandclay'),
-- 2026-06-08
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-08','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-08','23:03','C/Out','Brickandclay'),
-- 2026-06-09
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-09','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-09','23:21','C/Out','Brickandclay'),
-- 2026-06-10
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-10','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-10','23:33','C/Out','Brickandclay'),
-- 2026-06-11
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-11','13:57','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-11','23:48','C/Out','Brickandclay'),
-- 2026-06-12 (in only)
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-12','12:14','C/In','Brickandclay');

COMMIT;

-- ── Verify: count by name ─────────────────────────────────────────────
SELECT name, COUNT(*) AS punches
FROM attendance_punches
WHERE date >= '2026-06-01' AND date <= '2026-06-13'
GROUP BY name
ORDER BY name;

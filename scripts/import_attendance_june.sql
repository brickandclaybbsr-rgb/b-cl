-- ═══════════════════════════════════════════════════════════════════════
-- Re-import attendance punches — corrected from 10_StandardReport.xls
-- Col index 0 = June 1 … Col index 12 = June 13 (0-based, xlrd-confirmed)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── STEP 1: Wipe existing punches for June 1–13 ───────────────────────
DELETE FROM attendance_punches
WHERE date >= '2026-06-01' AND date <= '2026-06-13';

-- ── STEP 2: Insert correct punches ────────────────────────────────────

INSERT INTO attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES

-- ══ SURYA (biometric ID 1) ════════════════════════════════════════════
-- Jun 11 only (col10 = 11:54, single punch)
((SELECT id FROM profiles WHERE biometric_pin='1' OR name ILIKE 'Surya%' LIMIT 1),'1','Surya','2026-06-11','11:54','C/In','Brickandclay'),

-- ══ PRADOSH (biometric ID 2) ══════════════════════════════════════════
-- Jun 1 (col0): absent
-- Jun 2 (col1): 14:02/23:28
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-02','14:02','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-02','23:28','C/Out','Brickandclay'),
-- Jun 3 (col2): 11:09/21:54
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-03','11:09','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-03','21:54','C/Out','Brickandclay'),
-- Jun 4 (col3): 14:25/23:30
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-04','14:25','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-04','23:30','C/Out','Brickandclay'),
-- Jun 5 (col4): 11:50/23:46
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-05','11:50','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-05','23:46','C/Out','Brickandclay'),
-- Jun 6 (col5): 12:12/23:45
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-06','12:12','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-06','23:45','C/Out','Brickandclay'),
-- Jun 7 (col6): 14:07 in only
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-07','14:07','C/In','Brickandclay'),
-- Jun 8 (col7): 14:04/23:11
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-08','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-08','23:11','C/Out','Brickandclay'),
-- Jun 9 (col8): 11:04/19:09
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-09','11:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-09','19:09','C/Out','Brickandclay'),
-- Jun 10 (col9): absent
-- Jun 11 (col10): 13:56 in only
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-11','13:56','C/In','Brickandclay'),
-- Jun 12 (col11): 13:58/23:48
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-12','13:58','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-12','23:48','C/Out','Brickandclay'),
-- Jun 13 (col12): 13:24 in only
((SELECT id FROM profiles WHERE biometric_pin='2' OR name ILIKE 'Pradosh%' LIMIT 1),'2','Pradosh','2026-06-13','13:24','C/In','Brickandclay'),

-- ══ RAMAHARI (biometric ID 6) — present ALL 13 days ══════════════════
-- Jun 1 (col0): 10:01/23:37
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-01','10:01','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-01','23:37','C/Out','Brickandclay'),
-- Jun 2 (col1): 10:35/23:28
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-02','10:35','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-02','23:28','C/Out','Brickandclay'),
-- Jun 3 (col2): 09:56/23:59
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-03','09:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-03','23:59','C/Out','Brickandclay'),
-- Jun 4 (col3): 14:00/23:27
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-04','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-04','23:27','C/Out','Brickandclay'),
-- Jun 5 (col4): 13:55/23:45
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-05','13:55','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-05','23:45','C/Out','Brickandclay'),
-- Jun 6 (col5): 10:26/23:45
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','10:26','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-06','23:45','C/Out','Brickandclay'),
-- Jun 7 (col6): 10:23/14:47/17:55/23:30 — 4 punches (split shift)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','10:23','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','14:47','C/Out','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','17:55','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-07','23:30','C/Out','Brickandclay'),
-- Jun 8 (col7): 11:34/23:12
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-08','11:34','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-08','23:12','C/Out','Brickandclay'),
-- Jun 9 (col8): 14:00/23:20
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-09','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-09','23:20','C/Out','Brickandclay'),
-- Jun 10 (col9): 11:08/23:23
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-10','11:08','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-10','23:23','C/Out','Brickandclay'),
-- Jun 11 (col10): 11:13 in only
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-11','11:13','C/In','Brickandclay'),
-- Jun 12 (col11): 11:13/15:23/18:15/23:47 — 4 punches (split shift)
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-12','11:13','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-12','15:23','C/Out','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-12','18:15','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-12','23:47','C/Out','Brickandclay'),
-- Jun 13 (col12): 10:53 in only
((SELECT id FROM profiles WHERE biometric_pin='6' OR name ILIKE 'Ramahari%' LIMIT 1),'6','Ramahari','2026-06-13','10:53','C/In','Brickandclay'),

-- ══ SANDEEP / sande (biometric ID 8) — absent Jun 2,3,4 only ════════
-- Jun 1 (col0): 14:00/23:32
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-01','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-01','23:32','C/Out','Brickandclay'),
-- Jun 2,3,4 (col1,2,3): absent
-- Jun 5 (col4): 13:54/23:46
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-05','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-05','23:46','C/Out','Brickandclay'),
-- Jun 6 (col5): 14:10/23:46
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-06','14:10','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-06','23:46','C/Out','Brickandclay'),
-- Jun 7 (col6): 14:07 in only
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-07','14:07','C/In','Brickandclay'),
-- Jun 8 (col7): 12:17/23:10
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-08','12:17','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-08','23:10','C/Out','Brickandclay'),
-- Jun 9 (col8): 13:59/23:03
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-09','13:59','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-09','23:03','C/Out','Brickandclay'),
-- Jun 10 (col9): 13:54/23:21
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-10','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-10','23:21','C/Out','Brickandclay'),
-- Jun 11 (col10): 13:56/23:33
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-11','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-11','23:33','C/Out','Brickandclay'),
-- Jun 12 (col11): 13:57/23:48
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-12','13:57','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-12','23:48','C/Out','Brickandclay'),
-- Jun 13 (col12): 13:57 in only
((SELECT id FROM profiles WHERE biometric_pin='8' OR name ILIKE 'Sandeep%' LIMIT 1),'8','Sandeep','2026-06-13','13:57','C/In','Brickandclay'),

-- ══ MANOJ (biometric ID 9) — present all 13 days ═════════════════════
-- Jun 1 (col0): 13:59/23:32
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-01','13:59','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-01','23:32','C/Out','Brickandclay'),
-- Jun 2 (col1): 14:04/23:28
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-02','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-02','23:28','C/Out','Brickandclay'),
-- Jun 3 (col2): 13:56/23:57
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-03','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-03','23:57','C/Out','Brickandclay'),
-- Jun 4 (col3): 14:25/23:27
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-04','14:25','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-04','23:27','C/Out','Brickandclay'),
-- Jun 5 (col4): 11:50/23:45
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-05','11:50','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-05','23:45','C/Out','Brickandclay'),
-- Jun 6 (col5): 14:10/23:44
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-06','14:10','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-06','23:44','C/Out','Brickandclay'),
-- Jun 7 (col6): 14:07/23:26
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-07','14:07','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-07','23:26','C/Out','Brickandclay'),
-- Jun 8 (col7): 14:04/23:10
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-08','14:04','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-08','23:10','C/Out','Brickandclay'),
-- Jun 9 (col8): 14:00/23:03
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-09','14:00','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-09','23:03','C/Out','Brickandclay'),
-- Jun 10 (col9): 13:54/23:21
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-10','13:54','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-10','23:21','C/Out','Brickandclay'),
-- Jun 11 (col10): 13:56/23:33
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-11','13:56','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-11','23:33','C/Out','Brickandclay'),
-- Jun 12 (col11): 13:57/23:48
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-12','13:57','C/In','Brickandclay'),
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-12','23:48','C/Out','Brickandclay'),
-- Jun 13 (col12): 12:14 in only
((SELECT id FROM profiles WHERE biometric_pin='9' OR name ILIKE 'Manoj%' LIMIT 1),'9','Manoj','2026-06-13','12:14','C/In','Brickandclay');

COMMIT;

-- ── Verify ────────────────────────────────────────────────────────────
SELECT name, COUNT(*) AS punches,
       MIN(date) AS first_day, MAX(date) AS last_day
FROM attendance_punches
WHERE date >= '2026-06-01' AND date <= '2026-06-13'
GROUP BY name ORDER BY name;

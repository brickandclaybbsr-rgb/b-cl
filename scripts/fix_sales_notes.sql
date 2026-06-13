-- Fix ZoGoId label → ZomatoGold in imported sales notes
UPDATE public.daily_sales
SET notes = REPLACE(notes, 'ZoGoId:', 'ZomatoGold:')
WHERE notes LIKE '%ZoGoId:%';

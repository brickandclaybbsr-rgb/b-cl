-- Stores the latest FCM device token per profile so the server can push
-- notifications to owners (sales submitted, stock alerts, vendor orders, EOD).
alter table public.profiles
  add column if not exists fcm_token text;

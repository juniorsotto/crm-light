-- 20260726000001_quote_requests_broker_fields.sql
-- The broker (broker-tick) writes these three fields when a supplier reply arrives:
--   is_late      — the reply landed after the request expired (still recorded, just flagged)
--   raw_response — the plain-text body of the supplier's email (fed to the extractor)
--   responded_at — when the reply was matched
-- The initial quote_requests table omitted them, so broker-tick's RESPONDED patch failed with
-- PostgREST PGRST204 ("Could not find the 'is_late' column"): the reply WAS found and passed
-- looksLikeReply, but persisting the state threw, so the loop never advanced past SENT. Add them.
alter table public.quote_requests
  add column if not exists is_late      boolean,
  add column if not exists raw_response  text,
  add column if not exists responded_at  timestamptz;

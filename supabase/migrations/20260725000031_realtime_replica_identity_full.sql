-- 20260725000031_realtime_replica_identity_full.sql
--
-- Fix: the live lists (leads / kanban / contact timeline) weren't reflecting UPDATE and
-- DELETE in realtime — only INSERT. Root cause: with RLS enabled, Supabase Realtime needs
-- the FULL old row to evaluate the row's visibility on UPDATE/DELETE; with the default
-- REPLICA IDENTITY (primary key only) those change events are NOT broadcast to subscribers.
-- Setting REPLICA IDENTITY FULL makes the WAL carry the whole old row so Realtime emits
-- UPDATE/DELETE too. Applies to every table already in the supabase_realtime publication.
alter table public.contacts        replica identity full;  -- leads list: tag change / delete
alter table public.opportunities   replica identity full;  -- kanban: stage change / delete
alter table public.timeline_events replica identity full;  -- contact timeline
alter table public.quote_requests  replica identity full;

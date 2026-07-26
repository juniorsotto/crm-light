-- 20260725000021_realtime.sql
alter publication supabase_realtime add table public.opportunities;    -- live kanban
alter publication supabase_realtime add table public.timeline_events;  -- live contact view
alter publication supabase_realtime add table public.quote_requests;

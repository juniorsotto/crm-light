-- 20260725000008_timeline_events.sql
-- Keyed by contact_phone (stable, always present, universal join key --
-- mirrored messages can arrive before the contact row exists).
create table public.timeline_events (
  id             bigint generated always as identity primary key,
  contact_phone  text not null,               -- +E.164, read key
  contact_id     uuid references public.contacts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  kind           text not null check (kind in (
    'message_in','message_out','call_started','call_ended','muted','unmuted',
    'contact_created','opportunity_created','stage_changed',
    'quote_requested','quote_status','quote_delivered','note','task')),
  actor          text check (actor in ('customer','agent','advisor','human','system','supplier')),
  title          text,        -- short ES label ("Movió a Cotizando")
  body           text,        -- message text / note body
  meta           jsonb,       -- {from,to} | {request_code,status,supplier_name,premium} | ...
  occurred_at    timestamptz not null default now()
);
create index timeline_phone_time_idx on public.timeline_events (contact_phone, occurred_at desc);
create index timeline_opp_time_idx   on public.timeline_events (opportunity_id, occurred_at desc);

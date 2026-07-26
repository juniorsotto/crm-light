-- 20260725000006_quote_requests.sql
-- State machine, 14 statuses = broker.ts:35-49.
create table public.quote_requests (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
  request_code        text unique,            -- QR-<8 hex of the id>
  status              text not null default 'PENDING'
    check (status in ('PENDING','SENT','REMINDED','RESPONDED','QUOTED',
      'NEEDS_CLIENT_INFO','INFO_REQUESTED','RESENT','NEEDS_INTERNAL_ACTION',
      'NEEDS_REVIEW','DELIVERED','EXPIRED','FAILED','CANCELLED')),
  channel             text,
  attempt             int  not null default 1,
  strategy_used       text
    check (strategy_used in ('MANUAL_PRIORITY','MAX_MARGIN','FASTEST_RESPONSE',
                             'PARALLEL_TOP_N','BEST_FIT') or strategy_used is null),
  product_slug        text,
  product_id          uuid,
  route_id            uuid references public.supplier_routes(id) on delete set null,
  insurer_id          uuid,
  person_id           uuid references public.contacts(id) on delete set null,
  opportunity_id      uuid references public.opportunities(id) on delete set null,
  risk_data           jsonb,
  contact_phone       text,
  delivery_preference text,                   -- whatsapp|call
  sla_hours           numeric,
  premium_quoted      numeric,
  plan_name           text,
  conditions          text,
  parse_confidence    numeric,
  info_round          int not null default 0,
  sent_at             timestamptz,
  remind_at           timestamptz,
  expire_at           timestamptz,
  gmail_thread_id     text,
  gmail_message_id    text,
  created_at          timestamptz not null default now()
);
create index quote_requests_opp_idx    on public.quote_requests (opportunity_id);
create index quote_requests_status_idx on public.quote_requests (status);
create index quote_requests_phone_idx  on public.quote_requests (contact_phone);

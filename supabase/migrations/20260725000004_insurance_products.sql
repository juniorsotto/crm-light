-- 20260725000004_insurance_products.sql
-- Read by resolveProductRouting in the broker.
create table public.insurance_products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  name             text,
  routing_strategy text,          -- MANUAL_PRIORITY|MAX_MARGIN|FASTEST_RESPONSE|PARALLEL_TOP_N|BEST_FIT
  parallel_n       int,
  insurer_id       uuid,
  created_at       timestamptz not null default now()
);

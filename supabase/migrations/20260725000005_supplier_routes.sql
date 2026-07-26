-- 20260725000005_supplier_routes.sql
-- Insurer x product routing pool; metrics columns are written by the broker.
create table public.supplier_routes (
  id                 uuid primary key default gen_random_uuid(),
  product_slug       text,
  product_id         uuid,
  insurer_id         uuid,
  supplier_name      text,
  supplier_email     text,
  active             boolean not null default true,
  priority           int    not null default 999,
  commission_pct     numeric not null default 0,
  sla_hours          numeric not null default 24,
  avg_response_hours numeric,
  response_rate      numeric,
  requests_sent      int not null default 0,
  requests_answered  int not null default 0,
  created_at         timestamptz not null default now()
);
create index supplier_routes_product_idx on public.supplier_routes (product_slug, active, priority);

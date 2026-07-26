-- 20260725000003_opportunities.sql
-- 8 stages = mirror of TWENTY_OPPORTUNITY_STAGES (twenty.ts:222-231).
create table public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  stage               text not null default 'PROPENSION'
    check (stage in ('PROPENSION','CONTACTADO','CONVERSANDO','COTIZANDO',
                     'COTIZADO','ACEPTADO','ESCALADO_ASESOR','DESCARTADO')),
  amount              numeric,
  currency            text not null default 'COP',
  point_of_contact_id uuid references public.contacts(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index opportunities_poc_idx   on public.opportunities (point_of_contact_id);
create index opportunities_stage_idx on public.opportunities (stage);

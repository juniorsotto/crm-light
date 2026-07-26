-- 20260725000030_audience_tags.sql
-- Top-of-funnel audience tagging. An external propensity engine labels each
-- lead; the /leads view lists contacts with their audience tag(s). This is the
-- stage BEFORE the kanban. Next step (NOT built here): a newly-arrived tag
-- triggers grok -> next-best-action.
--
-- System structure only (schema + RLS + realtime). The catalog rows and the
-- demo leads live in seed.sql / runtime inserts, never in the migration record.

-- Catalog of audience tags -- the "small list of labels". Generic product
-- catalog (analogous to insurance_products), not tenant/client data.
create table if not exists public.audience_tags (
  slug                text primary key,
  label_es            text not null,
  label_en            text not null,
  description         text,                 -- short criterion
  color               text not null,        -- brand hex; drives the chip tint
  recommended_product text,                 -- suggested insurance_products.slug, nullable
  category            text,                 -- insurance line this tag maps to (nullable: value signals span lines)
  sort                int  not null default 100,
  created_at          timestamptz not null default now()
);

-- Slugs assigned to each lead by the propensity engine. Array is enough for the
-- demo (a lead can carry 1-2 audiences).
alter table public.contacts add column if not exists tags text[] not null default '{}';
create index if not exists contacts_tags_gin on public.contacts using gin (tags);

-- Insurance category / line an opportunity belongs to (vida | vehiculo | hogar |
-- mascota | exequial | salud). Powers the category filter over the kanban cards.
-- Same taxonomy the audience_tags catalog maps to via audience_tags.category.
alter table public.audience_tags add column if not exists category text;   -- for DBs created before this column existed
alter table public.opportunities add column if not exists category text;
create index if not exists opportunities_category_idx on public.opportunities (category);

-- RLS: read-open to anon (the front reads the catalog); writes via service_role
-- only (the propensity engine / owner), same posture as the other tables.
alter table public.audience_tags enable row level security;
revoke all on public.audience_tags from anon;
drop policy if exists read_all on public.audience_tags;
create policy read_all on public.audience_tags for select to anon using (true);
grant select on public.audience_tags to anon;

-- Live leads list: stream contacts changes so a row appears / re-renders the
-- moment a tag changes (this is the seam the grok step will hook into).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contacts'
  ) then
    execute 'alter publication supabase_realtime add table public.contacts';
  end if;
end $$;

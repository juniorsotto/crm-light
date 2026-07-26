-- 20260725000007_notes_tasks.sql
-- Polymorphic target = 2 nullable FKs + exactly-one CHECK.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  contact_id     uuid references public.contacts(id)      on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(contact_id, opportunity_id) = 1)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body  text,
  due_at timestamptz,
  contact_id     uuid references public.contacts(id)      on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(contact_id, opportunity_id) <= 1)
);

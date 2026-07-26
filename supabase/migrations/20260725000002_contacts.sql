-- 20260725000002_contacts.sql
create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  first_name  text,
  last_name   text,
  email       text,
  phone       text not null unique,           -- +E.164, match key
  created_at  timestamptz not null default now()
);
create unique index contacts_phone_idx on public.contacts (phone);

-- 20260725000001_init.sql
-- Extensions + phone normalization.
--
-- normalize_phone_e164() is a FROZEN verbatim port of Notifiica's
-- mig 20260604000001_normalize_owner_phone_in_admin_rpcs.sql body. Pure SQL
-- function, no deps -> ported by copy, not by cross-project import. Keep the
-- two bodies byte-identical if either is ever edited (see Notifiica's
-- CLAUDE.md "Phone canonical format" section).
create extension if not exists pgcrypto;

create or replace function public.normalize_phone_e164(p text)
returns text language sql immutable as $$
  select case
    when nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '') is null then p
    else '+' || regexp_replace(p, '\D', '', 'g')
  end;
$$;

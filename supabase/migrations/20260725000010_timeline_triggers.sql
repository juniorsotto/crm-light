-- 20260725000010_timeline_triggers.sql
-- Native projection of entity events into timeline_events. Any writer
-- (agent, broker, or the advisor dragging a card via PostgREST) gets its
-- timeline row automatically -- this is what captures the manual drag,
-- which a backend fan-out would miss (drag goes front->PostgREST directly).

-- ---------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------

-- resolve phone from a contacts.id
create or replace function public._phone_of(poc uuid) returns text
language sql stable as $$
  select phone from public.contacts where id = poc
$$;

-- resolve phone for a notes/tasks row: direct contact_id, or via the
-- opportunity's point_of_contact_id when the target is an opportunity.
create or replace function public._phone_of_target(p_contact_id uuid, p_opportunity_id uuid)
returns text language sql stable as $$
  select coalesce(
    (select phone from public.contacts where id = p_contact_id),
    (select c.phone
       from public.opportunities o
       join public.contacts c on c.id = o.point_of_contact_id
      where o.id = p_opportunity_id)
  )
$$;

-- Spanish label for a stage code -- mirrors SPEC.md 4.1.
create or replace function public._stage_label_es(s text) returns text
language sql immutable as $$
  select case s
    when 'PROPENSION'       then 'Propensión'
    when 'CONTACTADO'       then 'Contactado'
    when 'CONVERSANDO'      then 'Conversando'
    when 'COTIZANDO'        then 'Cotizando'
    when 'COTIZADO'         then 'Cotizado'
    when 'ACEPTADO'         then 'Aceptado'
    when 'ESCALADO_ASESOR'  then 'Escalado a asesor'
    when 'DESCARTADO'       then 'Descartado'
    else s
  end
$$;

-- ---------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------

create or replace function public.tl_contact_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.timeline_events (contact_phone, contact_id, kind, actor, title, body, meta)
  values (
    new.phone, new.id, 'contact_created', 'system',
    'Nuevo contacto: ' || coalesce(trim(concat_ws(' ', new.first_name, new.last_name)), new.phone),
    null,
    jsonb_build_object('first_name', new.first_name, 'last_name', new.last_name, 'email', new.email)
  );
  return new;
end;
$$;

create trigger tg_contact_created after insert on public.contacts
for each row execute function public.tl_contact_created();

-- ---------------------------------------------------------------------
-- opportunities: insert + stage change
-- ---------------------------------------------------------------------

create or replace function public.tl_opp_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (
    public._phone_of(new.point_of_contact_id), new.point_of_contact_id, new.id,
    'opportunity_created', 'system',
    'Nueva oportunidad: ' || new.name,
    null,
    jsonb_build_object('name', new.name, 'stage', new.stage, 'amount', new.amount, 'currency', new.currency)
  );
  return new;
end;
$$;

create trigger tg_opp_created after insert on public.opportunities
for each row execute function public.tl_opp_created();

create or replace function public.tl_stage_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (
    public._phone_of(new.point_of_contact_id), new.point_of_contact_id, new.id,
    'stage_changed', 'advisor',
    'Movió a ' || public._stage_label_es(new.stage),
    null,
    jsonb_build_object('from', old.stage, 'to', new.stage)
  );
  return new;
end;
$$;

create trigger tg_opp_stage after update of stage on public.opportunities
for each row when (old.stage is distinct from new.stage)
execute function public.tl_stage_changed();

-- ---------------------------------------------------------------------
-- quote_requests: insert + status change (+ DELIVERED special-case)
-- ---------------------------------------------------------------------

create or replace function public.tl_qr_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_supplier text;
begin
  v_phone := coalesce(new.contact_phone, public._phone_of(new.person_id));
  select supplier_name into v_supplier from public.supplier_routes where id = new.route_id;

  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (
    v_phone, new.person_id, new.opportunity_id,
    'quote_requested', 'system',
    'Solicitó cotización' || coalesce(' a ' || v_supplier, ''),
    null,
    jsonb_build_object(
      'request_code', new.request_code, 'status', new.status,
      'supplier_name', v_supplier, 'product_slug', new.product_slug,
      'strategy_used', new.strategy_used
    )
  );
  return new;
end;
$$;

create trigger tg_qr_created after insert on public.quote_requests
for each row execute function public.tl_qr_created();

create or replace function public.tl_qr_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
  v_supplier text;
  v_kind text;
begin
  v_phone := coalesce(new.contact_phone, public._phone_of(new.person_id));
  select supplier_name into v_supplier from public.supplier_routes where id = new.route_id;
  v_kind := case when new.status = 'DELIVERED' then 'quote_delivered' else 'quote_status' end;

  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (
    v_phone, new.person_id, new.opportunity_id,
    v_kind, 'supplier',
    case
      when new.status = 'DELIVERED' then
        'Cotización entregada' || case when new.premium_quoted is not null
          then ' · ' || new.premium_quoted::text else '' end
      else new.request_code || ': ' || new.status
    end,
    null,
    jsonb_build_object(
      'request_code', new.request_code, 'status', new.status,
      'supplier_name', v_supplier, 'premium_quoted', new.premium_quoted,
      'plan_name', new.plan_name
    )
  );
  return new;
end;
$$;

create trigger tg_qr_status after update of status on public.quote_requests
for each row when (old.status is distinct from new.status)
execute function public.tl_qr_status();

-- ---------------------------------------------------------------------
-- notes / tasks
-- ---------------------------------------------------------------------

create or replace function public.tl_note() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
begin
  v_phone := public._phone_of_target(new.contact_id, new.opportunity_id);
  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (v_phone, new.contact_id, new.opportunity_id, 'note', 'advisor', 'Nota', new.body, null);
  return new;
end;
$$;

create trigger tg_note after insert on public.notes
for each row execute function public.tl_note();

create or replace function public.tl_task() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_phone text;
begin
  v_phone := public._phone_of_target(new.contact_id, new.opportunity_id);
  insert into public.timeline_events (contact_phone, contact_id, opportunity_id, kind, actor, title, body, meta)
  values (
    v_phone, new.contact_id, new.opportunity_id, 'task', 'advisor', new.title, new.body,
    jsonb_build_object('due_at', new.due_at)
  );
  return new;
end;
$$;

create trigger tg_task after insert on public.tasks
for each row execute function public.tl_task();

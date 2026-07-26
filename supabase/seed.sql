-- seed.sql -- reference structure for local dev/demo only:
-- insurance_products + supplier_routes (aseguradoras) demo + 1 sample contact.
-- Coherent with "migrations = system structure only" -- this is seed data for
-- the CRM-light project itself (analogous to Notifiica's plans seed), not a
-- tenant's private catalog.

insert into public.insurance_products (id, slug, name, routing_strategy, parallel_n) values
  ('11111111-1111-1111-1111-111111111101', 'soat',        'SOAT',                  'MANUAL_PRIORITY',   null),
  ('11111111-1111-1111-1111-111111111102', 'vida',        'Seguro de Vida',        'BEST_FIT',          null),
  ('11111111-1111-1111-1111-111111111103', 'hogar',       'Seguro de Hogar',       'MAX_MARGIN',        null),
  ('11111111-1111-1111-1111-111111111104', 'auto',        'Seguro de Auto',        'PARALLEL_TOP_N',    3),
  ('11111111-1111-1111-1111-111111111105', 'salud',       'Seguro de Salud',       'FASTEST_RESPONSE',  null)
on conflict (slug) do nothing;

insert into public.supplier_routes
  (product_slug, product_id, supplier_name, supplier_email, active, priority, commission_pct, sla_hours) values
  ('soat',  '11111111-1111-1111-1111-111111111101', 'Sura',          'cotizaciones@sura-demo.test',       true, 1, 0.12, 24),
  ('soat',  '11111111-1111-1111-1111-111111111101', 'Mapfre',        'cotizaciones@mapfre-demo.test',     true, 2, 0.10, 24),
  ('vida',  '11111111-1111-1111-1111-111111111102', 'Colpatria',     'cotizaciones@colpatria-demo.test',  true, 1, 0.18, 48),
  ('vida',  '11111111-1111-1111-1111-111111111102', 'Bolivar',       'cotizaciones@bolivar-demo.test',    true, 2, 0.15, 48),
  ('hogar', '11111111-1111-1111-1111-111111111103', 'Sura',          'cotizaciones@sura-demo.test',       true, 1, 0.14, 24),
  ('auto',  '11111111-1111-1111-1111-111111111104', 'Sura',          'cotizaciones@sura-demo.test',       true, 1, 0.13, 24),
  ('auto',  '11111111-1111-1111-1111-111111111104', 'Mapfre',        'cotizaciones@mapfre-demo.test',     true, 2, 0.11, 24),
  ('auto',  '11111111-1111-1111-1111-111111111104', 'Colpatria',     'cotizaciones@colpatria-demo.test',  true, 3, 0.10, 24),
  ('salud', '11111111-1111-1111-1111-111111111105', 'Bolivar',       'cotizaciones@bolivar-demo.test',    true, 1, 0.16, 12);

insert into public.contacts (id, first_name, last_name, email, phone) values
  ('22222222-2222-2222-2222-222222222201', 'Didier', 'Demo', 'didier@notifiica-demo.test', '+573100000001')
on conflict (phone) do nothing;

-- ============================================================
-- Audience tagging (top-of-funnel) -- catalog + demo leads.
-- The catalog (audience_tags) is a generic product taxonomy, like
-- insurance_products. The tagged leads are demo/runtime data (analogous to the
-- Didier sample above), kept here only for local reproducibility.
-- ============================================================

-- 1) Catalog: the "small list of labels". category = insurance line it maps to
--    (nullable for value signals like alto_valor that span lines).
insert into public.audience_tags
  (slug, label_es, label_en, description, color, recommended_product, category, sort) values
  ('evento_prenatal',    'Evento prenatal',    'Prenatal event',   'Primer control prenatal detectado en la familia',   '#DB2777', 'vida',  'vida',     10),
  ('prospecto_vida',     'Prospecto vida',     'Life prospect',    'Señales de interés en protección de vida',          '#0067B1', 'vida',  'vida',     20),
  ('renovacion_soat',    'Renovación SOAT',    'SOAT renewal',     'SOAT próximo a vencer (~30 días)',                  '#F5A524', 'soat',  'vehiculo', 30),
  ('prospecto_vehiculo', 'Prospecto vehículo', 'Vehicle prospect', 'Vehículo registrado sin póliza de auto',            '#6366F1', 'auto',  'vehiculo', 40),
  ('prospecto_hogar',    'Prospecto hogar',    'Home prospect',    'Vivienda propia sin seguro de hogar',               '#16A34A', 'hogar', 'hogar',    50),
  ('prospecto_mascota',  'Prospecto mascota',  'Pet prospect',     'Mascota registrada, sin plan de salud animal',      '#0E9AA8', null,    'mascota',  60),
  ('prospecto_exequial', 'Prospecto exequial', 'Funeral prospect', 'Grupo familiar sin cobertura exequial',             '#64748B', null,    'exequial', 70),
  ('alto_valor',         'Alto valor',         'High value',       'Alta capacidad de pago / cross-sell prioritario',   '#E0B700', null,    null,       80)
on conflict (slug) do update set
  label_es=excluded.label_es, label_en=excluded.label_en, description=excluded.description,
  color=excluded.color, recommended_product=excluded.recommended_product,
  category=excluded.category, sort=excluded.sort;

-- 2) Demo leads (new). Colombian names; 1-2 audiences each.
insert into public.contacts (first_name, last_name, email, phone) values
  ('Ricardo',   'Salazar',  'ricardo.salazar@example.co', '+573170001234'),
  ('Laura',     'Restrepo',  null,                         '+573181112233'),
  ('Andrés',    'Cárdenas', 'andres.cardenas@example.co', '+573145556677'),
  ('Diana',     'Moreno',    null,                         '+573196667788'),
  ('Julián',    'Pérez',     null,                         '+573158889900'),
  ('Valentina', 'Ríos',     'valentina.rios@example.co',  '+573162223344'),
  ('Santiago',  'Muñoz',     null,                         '+573173334455')
on conflict (phone) do nothing;

-- 3) Assign audience tags (idempotent, matched by phone).
--    Ricardo = the star case: wife's first prenatal control -> life prospect.
update public.contacts set tags = '{prospecto_vida,alto_valor}'         where phone='+573100000001';  -- Didier
update public.contacts set tags = '{prospecto_hogar}'                   where phone='+573114445566';  -- María
update public.contacts set tags = '{prospecto_vehiculo,renovacion_soat}' where phone='+573129998877'; -- Carlos
update public.contacts set tags = '{prospecto_mascota}'                 where phone='+573001239001';  -- Beltran
update public.contacts set tags = '{evento_prenatal}'                   where phone='+573170001234';  -- Ricardo ★
update public.contacts set tags = '{prospecto_mascota,prospecto_vida}'  where phone='+573181112233';  -- Laura
update public.contacts set tags = '{prospecto_vehiculo,alto_valor}'     where phone='+573145556677';  -- Andrés
update public.contacts set tags = '{prospecto_hogar,prospecto_vida}'    where phone='+573196667788';  -- Diana
update public.contacts set tags = '{renovacion_soat}'                   where phone='+573158889900';  -- Julián
update public.contacts set tags = '{prospecto_exequial}'                where phone='+573162223344';  -- Valentina
update public.contacts set tags = '{prospecto_vida,alto_valor}'         where phone='+573173334455';  -- Santiago

-- 4) Backfill opportunities.category from the opportunity name (insurance line),
--    so the kanban category filter has data. Order: specific lines last win ties.
update public.opportunities set category='salud'    where name ilike '%salud%';
update public.opportunities set category='hogar'    where name ilike '%hogar%';
update public.opportunities set category='vehiculo' where name ilike '%soat%' or name ilike '%auto%' or name ilike '%moto%' or name ilike '%mazda%';
update public.opportunities set category='vida'     where name ilike '%vida%';

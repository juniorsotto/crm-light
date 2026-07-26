# CRM Light — SPEC CANÓNICO (fusión de las 3 propuestas)

Nota de fusión: la propuesta [UX] llegó vacía (solo repitió boilerplate), así que la sección 4 la diseño desde los tokens de marca + las 8 etapas + los kinds de timeline verificados. Conflictos resueltos a favor de [DATA/API] donde hubo rigor de código (el seam real es `TwentyClient`, timeline por triggers) y de [SHIPPABLE] donde hubo verificación de infra (puertos reales, stack front, estructura). Justificación de cada elección al final de cada sección.

---

## 0. Decisiones de arquitectura (condicionan todo)

1. **El seam del recable es `TwentyClient`, NO el provider `twenty`.** Ambos caminos que escriben al CRM construyen `TwentyClient` desde el mismo `crm` ConnectionRef: el agente en `providers/twenty.ts:588` y el broker en `supplier_quote.ts` `resolveTwenty()` (`:495-503`, que `broker-tick` reimporta). Un provider nuevo recablearía solo al agente y dejaría el broker escribiendo a Twenty. → Recable = **fachada `CrmLightClient` con la misma superficie pública que `TwentyClient`, seleccionada por env, intercambiada en 2 sitios de construcción.** Cero cambios en `nodes.ts`, `broker.ts`, `broker-tick`, `eventSummary.ts`, `curatePerson/curateOpportunity/parseSupplierRoute`.
   *(Gana [DATA/API]: [SHIPPABLE] reemplazaba `twenty.ts` por exports paralelos, más blast radius y no garantizaba shape-Twenty para el broker.)*

2. **Timeline por TRIGGERS en la BD, no por fan-out del backend.** Cualquier escritura (agente, broker, o el asesor moviendo la card por PostgREST) emite su fila de timeline automáticamente. Esto captura el **drag manual del asesor**, que un fan-out en el backend perdería (el drag va front→PostgREST, nunca pasa por el backend).
   *(Gana [DATA/API]. De [SHIPPABLE] se conserva la idea de fan-out SOLO para lo que no es entidad-CRM: mensajes WhatsApp/voz + llamadas, que viven en Notifiica-main — ver §3.)*

3. **Proyecto Supabase nuevo, dedicado, local-first, puertos +1000.** Migraciones = el entregable. Sin auth = front con anon key; backend escribe con service_role.

---

## 1. Modelo de datos Supabase (DDL)

Convención: snake_case inglés (la fachada traduce camelCase↔snake_case y compone/descompone los composites Twenty). `phone` canónico `+E.164`. Archivo por migración en `crm-light/supabase/migrations/`.

### 1.0 Extensiones + normalización de teléfono
```sql
-- 20260725000001_init.sql
create extension if not exists pgcrypto;

-- copia FROZEN de normalize_phone_e164() (mig 20260604000001 de Notifiica).
-- Función pura, sin deps → se porta verbatim. NO se puede importar cross-proyecto.
create or replace function public.normalize_phone_e164(p text) returns text
language sql immutable as $$
  select case when p is null or btrim(p)='' then null
    else '+' || regexp_replace(p, '[^0-9]', '', 'g') end
$$;  -- (reemplazar por el cuerpo exacto de la mig 20260604000001 al portar)
```

### 1.1 contacts (Person)
```sql
create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  first_name  text,
  last_name   text,
  email       text,
  phone       text not null unique,           -- +E.164, clave de match
  created_at  timestamptz not null default now()
);
create unique index contacts_phone_idx on public.contacts (phone);
```

### 1.2 opportunities (8 etapas)
```sql
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
```
*Los 8 valores = espejo exacto de `TWENTY_OPPORTUNITY_STAGES` (`twenty.ts:222-231`).*

### 1.3 insurance_products (la lee `resolveProductRouting` — [DATA/API] la cazó faltante)
```sql
create table public.insurance_products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  name             text,
  routing_strategy text,          -- MANUAL_PRIORITY|MAX_MARGIN|FASTEST_RESPONSE|PARALLEL_TOP_N|BEST_FIT
  parallel_n       int,
  insurer_id       uuid,
  created_at       timestamptz not null default now()
);
```

### 1.4 supplier_routes (pool aseguradora×producto; métricas las escribe el broker)
```sql
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
```

### 1.5 quote_requests (state machine, 14 estados = `broker.ts:35-49`)
```sql
create table public.quote_requests (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
  request_code        text unique,            -- QR-<8 hex del id>
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
```

### 1.6 notes / tasks (target polimórfico = 2 FK nullable + CHECK exactly-one)
```sql
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
```

### 1.7 timeline_events (la pieza que colapsa los 3 streams de Notifiica en 1)
Keyed por `contact_phone` (estable, siempre presente, universal join key — los mensajes espejados pueden llegar antes de que exista el contacto).
```sql
create table public.timeline_events (
  id             bigint generated always as identity primary key,
  contact_phone  text not null,               -- +E.164, clave de lectura
  contact_id     uuid references public.contacts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  kind           text not null check (kind in (
    'message_in','message_out','call_started','call_ended','muted','unmuted',
    'contact_created','opportunity_created','stage_changed',
    'quote_requested','quote_status','quote_delivered','note','task')),
  actor          text check (actor in ('customer','agent','advisor','human','system','supplier')),
  title          text,        -- etiqueta corta ES ("Movió a Cotizando")
  body           text,        -- texto del mensaje / cuerpo de la nota
  meta           jsonb,       -- {from,to} | {request_code,status,supplier_name,premium} | ...
  occurred_at    timestamptz not null default now()
);
create index timeline_phone_time_idx on public.timeline_events (contact_phone, occurred_at desc);
create index timeline_opp_time_idx   on public.timeline_events (opportunity_id, occurred_at desc);
```
*PK bigint identity (append-only, más barato que uuid — resuelve el conflicto uuid vs bigint a favor de identity).*

### 1.8 Triggers (proyección nativa de eventos de entidad)
```sql
-- 20260725000010_timeline_triggers.sql  (resumen; escribir cada fn en la mig)

-- helper: resuelve phone desde point_of_contact_id
create or replace function public._phone_of(poc uuid) returns text
language sql stable as $$ select phone from public.contacts where id = poc $$;

-- contacts
create trigger tg_contact_created after insert on public.contacts
for each row execute function public.tl_contact_created();      -- kind contact_created

-- opportunities: insert + stage change
create trigger tg_opp_created after insert on public.opportunities
for each row execute function public.tl_opp_created();          -- opportunity_created
create trigger tg_opp_stage after update of stage on public.opportunities
for each row when (old.stage is distinct from new.stage)
execute function public.tl_stage_changed();
-- tl_stage_changed: actor='advisor' (asume front); title='Movió a '||label(new.stage);
--   meta = jsonb_build_object('from',old.stage,'to',new.stage);
--   contact_phone = public._phone_of(new.point_of_contact_id)

-- quote_requests: insert + status change (+ DELIVERED especial)
create trigger tg_qr_created after insert on public.quote_requests
for each row execute function public.tl_qr_created();           -- quote_requested
create trigger tg_qr_status after update of status on public.quote_requests
for each row when (old.status is distinct from new.status)
execute function public.tl_qr_status();  -- quote_status; si new.status='DELIVERED' → kind quote_delivered

-- notes / tasks
create trigger tg_note after insert on public.notes
for each row execute function public.tl_note();                 -- note
create trigger tg_task after insert on public.tasks
for each row execute function public.tl_task();                 -- task
```
Cada `tl_*` resuelve `contact_phone` (vía `_phone_of` o el propio row) y hace `insert into timeline_events`. **Mensajes/llamadas NO se cubren por triggers** (viven en Notifiica-main) → §3.5 mirror.

### 1.9 RLS abierta sin auth + Realtime
```sql
-- 20260725000020_rls_open_demo.sql
-- Todas las tablas: RLS habilitado (explícito y auditable > disable silencioso).
alter table public.contacts          enable row level security;
alter table public.opportunities     enable row level security;
alter table public.insurance_products enable row level security;
alter table public.supplier_routes   enable row level security;
alter table public.quote_requests    enable row level security;
alter table public.notes             enable row level security;
alter table public.tasks             enable row level security;
alter table public.timeline_events   enable row level security;

-- LECTURA abierta a anon en todo (kanban + timeline):
create policy read_all on public.contacts          for select to anon using (true);
-- ... (misma policy read_all en las 8 tablas) ...
grant select on all tables in schema public to anon;

-- ESCRITURA anon acotada al gesto real del asesor en el demo:
--   drag de card = UPDATE solo columna stage:
grant update (stage) on public.opportunities to anon;
create policy advisor_move_stage on public.opportunities for update to anon using (true) with check (true);
--   nota desde el front:
grant insert on public.notes to anon;
create policy advisor_add_note on public.notes for insert to anon with check (true);
-- SIN delete para anon. Todo el resto de writes = service_role (bypassa RLS).
```
*Resuelve el conflicto RLS: cumple "abierta sin auth" (anon key, sin login) pero acota las escrituras anon a los 2 gestos que el front realmente hace, en vez de `for all using(true)` total. Si se prefiere el full-open de [SHIPPABLE] por simplicidad de demo, sustituir las 2 policies acotadas por `for all to anon using(true) with check(true)` — flag: cualquiera con la URL escribe todo.*

```sql
-- 20260725000021_realtime.sql
alter publication supabase_realtime add table public.opportunities;    -- kanban vivo
alter publication supabase_realtime add table public.timeline_events;  -- contact view vivo
alter publication supabase_realtime add table public.quote_requests;
```

`service_role` key **nunca** al browser.

---

## 2. Contrato API PostgREST

Base local `http://127.0.0.1:55321/rest/v1` — cloud `https://<ref>.supabase.co/rest/v1`. Headers: `apikey: <key>` + `Authorization: Bearer <key>`.

### Front (anon key, sin BFF — patrón "Camino B")
| Uso | Request |
|---|---|
| Kanban (8 columnas) | `GET /opportunities?select=*,contacts:point_of_contact_id(*)&order=created_at.desc` + realtime sub `opportunities` |
| Mover card (drag) | `PATCH /opportunities?id=eq.<id>` body `{"stage":"COTIZANDO"}` |
| Abrir contacto (header) | `GET /contacts?phone=eq.<+E164>` (o `id=eq.<id>`) |
| Timeline del contacto | `GET /timeline_events?contact_phone=eq.<+E164>&order=occurred_at.asc` + realtime sub filtrada por `contact_phone=eq.<+E164>` |
| Cotizaciones del contacto | `GET /quote_requests?contact_phone=eq.<+E164>&order=created_at.desc` |
| Agregar nota | `POST /notes` body `{"body":"...","contact_id":"<id>"}` |

### Backend (service_role, vía fachada — ver §3)
Mismos endpoints, todos los verbos. La fachada traduce filtros Twenty→PostgREST y (un)nesta composites.

---

## 3. Plan de RECABLE del backend Notifiica

### 3.1 Nuevo archivo `_shared/crmLight.ts` — fachada + factory
`CrmLightClient` reproduce la superficie pública de `TwentyClient`: `request`, `findPersonByPhone`, `upsertPersonByPhone`, `createOpportunity`, `updateOpportunityStage`, `findOpportunitiesForPerson`, `createRecord`, `attachNote`, `createTask`. Habla PostgREST (Deno `fetch`) contra la BD CRM-light y **devuelve registros en shape Twenty** (composites anidados) para no tocar `curate*`/`parseSupplierRoute`/broker.

Piezas internas (confinadas al archivo):
1. **Slug→tabla:** `people→contacts, opportunities→opportunities, quoteRequests→quote_requests, supplierRoutes→supplier_routes, insuranceProducts→insurance_products, notes→notes, tasks→tasks`.
2. **Traductor filtro Twenty→PostgREST** (patrones reales del broker): `field[eq]:v → field=eq.v`; `field[ilike]:%v → field=ilike.*v`. Ej.: `slug[eq]:vida→product_slug=eq.vida`; `pointOfContactId[eq]:<id>→point_of_contact_id=eq.<id>`; `status[eq]:RESPONDED→status=eq.RESPONDED`. El `phones.primaryPhoneNumber[ilike]:%<suffix>` de Twenty se simplifica a `phone=eq.<+E164>` (exacto; no hay split de calling code).
3. **camelCase↔snake_case genérico** en keys de body (write) y rows (read).
4. **(Un)nest de 4 composites** (lista cerrada): write aplana `name.{firstName,lastName}`, `phones.primaryPhoneNumber`, `emails.primaryEmail`, `amount.{amountMicros,currencyCode}`, `bodyV2.markdown`; read los reconstruye. `amountMicros/1e6 ↔ amount numeric`.
5. **notes/tasks:** `attachNote/createTask({targetId,targetObjectSlug})` → `contact_id`/`opportunity_id` directo (person→contact_id, opportunity→opportunity_id).
6. **request_code:** `default` en columna o derivar `QR-<8 hex del id>` post-insert (= `requestCodeFromId`).

### 3.2 Factory + intercambio (2 líneas de construcción)
```ts
// crmLight.ts
export function makeCrmClient(cfg: {baseUrl:string; apiKey:string}): TwentyClient {
  if (Deno.env.get("CRM_BACKEND") === "light") {
    return new CrmLightClient({
      url: Deno.env.get("CRM_LIGHT_URL")!,
      key: Deno.env.get("CRM_LIGHT_SERVICE_KEY")!,
    }) as unknown as TwentyClient;
  }
  return new TwentyClient(cfg);
}
```
- `providers/twenty.ts:588` → `const client = makeCrmClient({baseUrl, apiKey})`.
- `supplier_quote.ts` `resolveTwenty` → `return {ok:true, client: makeCrmClient({baseUrl, apiKey})}` (recablea **también** `broker-tick`, que importa `resolveTwenty`).

Variante limpia opcional: `interface CrmClient` con los 9 métodos, `TwentyClient implements CrmClient`, retornar `CrmClient` sin cast. Blast radius: 3 anotaciones de tipo.

### 3.3 Env / config
```
CRM_BACKEND=light
CRM_LIGHT_URL=http://127.0.0.1:55321/rest/v1        # cloud: https://<ref>.supabase.co/rest/v1
CRM_LIGHT_SERVICE_KEY=<service_role de crm-light>
```
`supabase/functions/.env` (local) + `supabase secrets set` explícito (prod). El `crm` integration (provider `twenty`) **sigue "conectado"** en el catálogo para que el gating y el binding de tools `crm.*` funcionen sin tocar nada; su `base_url`/api_key quedan inertes (la factory los ignora en modo `light`). Una sola BD CRM-light, sin Vault/per-tenant.
**`twenty-webhook/` edge function se retira** (el cambio manual de etapa ahora es `PATCH` directo del kanban→PostgREST; no hay Twenty que dispare webhook). No borrar la fila del catálogo — solo la función.

### 3.4 Mapeo acción crm.* → PostgREST
| Acción (agente/broker) | Método fachada | PostgREST |
|---|---|---|
| `crm.find_contact` | `findPersonByPhone` | `GET /contacts?phone=eq.<+E164>&limit=1` |
| `crm.upsert_contact` | `upsertPersonByPhone` | find → `PATCH /contacts?id=eq.<id>` \| `POST /contacts` |
| `crm.upsert_opportunity` | `findOpportunitiesForPerson`+`createOpportunity` | `GET /opportunities?point_of_contact_id=eq.<id>` → `POST /opportunities` |
| `crm.set_stage` / `moveStageBestEffort` | `updateOpportunityStage` | `PATCH /opportunities?id=eq.<id>` `{stage}` → trigger `stage_changed` |
| `crm.log_note` | `attachNote` | `POST /notes` → trigger `note` |
| `crm.create_task` | `createTask` | `POST /tasks` → trigger `task` |
| broker pool | `request GET supplierRoutes` | `GET /supplier_routes?product_slug=eq.<slug>` |
| broker producto | `request GET insuranceProducts` | `GET /insurance_products?slug=eq.<slug>&limit=1` |
| broker crear solicitud | `request POST quoteRequests` | `POST /quote_requests` → trigger `quote_requested` |
| broker transición | `request PATCH quoteRequests/<id>` | `PATCH /quote_requests?id=eq.<id>` `{status,...}` → trigger `quote_status` |
| broker métricas ruta | `request PATCH supplierRoutes/<id>` | `PATCH /supplier_routes?id=eq.<id>` `{requests_sent,...}` |

### 3.5 Mirror de mensajes/llamadas (lo único fuera de la fachada)
Los bubbles WhatsApp/voz y `call_started/ended/muted/unmuted` viven en Notifiica-main (`message_log`, `conversation_events`) — no son entidades CRM, los triggers no los ven. **Solución: helper `mirrorTimelineEvent()` fire-and-forget** (mismo patrón no-bloqueante que `moveStageBestEffort`) que hace `POST /timeline_events` a CRM-light con service_role, insertado junto a los 3 sitios de logging existentes en `wa-webhook`/voice-llm:
- junto a `logMessageText` → `message_in`
- junto a `logAssistant` → `message_out`
- junto a los inserts de `conversation_events` (voice `call_*`, mute/unmute) → `call_started`/`call_ended`/`muted`/`unmuted`

Best-effort: si CRM-light cae, el turno del agente no se rompe; el timeline queda incompleto hasta que vuelva.
*(Resuelve el punto abierto de [DATA/API] eligiendo su opción A "mirror", implementada con el helper de [SHIPPABLE]. Mantiene front single-source + sin auth; el recable del CRM queda intacto.)*

### Archivos clave (rutas absolutas)
- Seam agente: `/Users/jhon/Documents/caimandrilo/notifiica/notifiica-supa-langgraph/wt/hackathon-integrations/supabase/functions/_shared/integrations/providers/twenty.ts` (`:588`, stages `:222-231`)
- Seam broker: `.../_shared/integrations/providers/supplier_quote.ts` (`resolveTwenty` `:495-503`; raw requests `:676,782,856,875,975`) y `.../broker-tick/index.ts`
- Cliente base: `.../_shared/twenty.ts` (`TwentyClient`)
- Dispatch (NO se toca): `.../_shared/graph/nodes.ts` (`:493-553`)
- State machine (14 status): `.../_shared/broker.ts` (`:35-49`)
- Nuevos: `.../_shared/crmLight.ts` (fachada+factory), `.../_shared/mirrorTimeline.ts` (helper mirror)

---

## 4. Diseño UI (kanban 8 etapas live + timeline por contacto)

Tokens de marca portados de `colors_and_type.css` del design-system a `web/styles/design-tokens.css` (variables en inglés). Theme-aware (light/dark). Copy ES/EN vía `lib/i18n.ts` (default ES; el hackathon es en Bogotá).

### 4.1 Etiquetas de etapa + color semántico
| stage (DB) | ES | EN | token color |
|---|---|---|---|
| PROPENSION | Propensión | Propensity | `--stage-neutral` (gris) |
| CONTACTADO | Contactado | Contacted | `--stage-info` (azul claro) |
| CONVERSANDO | Conversando | In conversation | `--brand-primary` |
| COTIZANDO | Cotizando | Quoting | `--stage-warn` (ámbar) — pulso live |
| COTIZADO | Cotizado | Quoted | `--stage-warn-strong` |
| ACEPTADO | Aceptado | Accepted | `--stage-success` (verde) |
| ESCALADO_ASESOR | Escalado a asesor | Escalated to advisor | `--stage-alert` (morado) |
| DESCARTADO | Descartado | Discarded | `--stage-muted` |

### 4.2 Kanban (`app/kanban/page.tsx`)
- Layout: 8 columnas horizontales scroll-x en su contenedor (`overflow-x:auto`), header sticky con contador por columna. En móvil colapsa a columnas apiladas con selector de etapa.
- `<KanbanBoard>` → 8×`<KanbanColumn stage>` → n×`<OpportunityCard>`.
- **Live:** al montar, `GET /opportunities?select=*,contacts:point_of_contact_id(*)`; suscripción realtime a `opportunities` (INSERT/UPDATE) → mueve la card a su columna con transición; badge "live" verde parpadeante en el header.
- **Drag & DnD:** `@dnd-kit/core`. On drop → optimistic move + `PATCH /opportunities?id=eq.<id>{stage}`; rollback si falla. La `stage_changed` la emite el trigger, no el front.
- `<OpportunityCard>`: nombre del contacto, `name` de la oportunidad, monto (`amount COP` formateado), teléfono, chip de la etapa, y mini-indicador si tiene `quote_requests` activas (`COTIZANDO` → spinner ámbar). Click → `/contacts/[id]`.

### 4.3 Timeline (`app/contacts/[id]/page.tsx`)
- Header de contacto: avatar-iniciales, nombre, phone (+E.164), email, chip de etapa de su oportunidad activa, monto.
- Panel derecho `<QuoteRequestsPanel>`: lista de `quote_requests` del contacto con `request_code`, `supplier_name`, `status` (chip), `premium_quoted`.
- Centro `<ContactTimeline>`: `GET /timeline_events?contact_phone=eq.<+E164>&order=occurred_at.asc` + realtime sub filtrada. `<TimelineItem>` hace `switch(kind)`:
  - `message_in`/`message_out` → burbuja (in=izq gris, out=der `--brand-primary`), `body`, hora.
  - `call_started/ended` → chip de llamada con duración (de `meta`).
  - `stage_changed` → línea "→ Movió a {label(meta.to)}" con el color de la etapa destino.
  - `quote_requested`/`quote_status`/`quote_delivered` → "Solicitó cotización a {meta.supplier_name}" / "{request_code}: {status}" / "Cotización entregada · {premium}".
  - `note`/`task` → tarjeta con icono.
  - `muted/unmuted`, `contact_created`, `opportunity_created` → línea de sistema tenue.
  - Cada item: icono por `actor` (customer/agent/advisor/system/supplier), timestamp relativo.
- **Agregar nota:** input al pie → `POST /notes {body, contact_id}`; aparece por realtime (trigger `note`).

### 4.4 Componentes UI base (portados del design-system)
`ui/Badge`, `ui/Card`, `ui/Chip` (etapa/estado), `ui/Avatar`, `ui/Toast` (para rollback de drag). Tipografía y logo desde tokens de marca. Copy ES/EN centralizado; sin strings hardcodeados en componentes.

---

## 5. Estructura de carpetas + stack + correr local + deploy

### 5.1 Estructura
```
notifiica/crm-light/
├── supabase/                       # ENTREGABLE independiente (historial de migración propio)
│   ├── config.toml                 # project_id="notifiica-crm-light", puertos +1000
│   ├── migrations/
│   │   ├── 20260725000001_init.sql               # extensiones + normalize_phone_e164
│   │   ├── 20260725000002_contacts.sql
│   │   ├── 20260725000003_opportunities.sql
│   │   ├── 20260725000004_insurance_products.sql
│   │   ├── 20260725000005_supplier_routes.sql
│   │   ├── 20260725000006_quote_requests.sql
│   │   ├── 20260725000007_notes_tasks.sql
│   │   ├── 20260725000008_timeline_events.sql
│   │   ├── 20260725000010_timeline_triggers.sql
│   │   ├── 20260725000020_rls_open_demo.sql
│   │   └── 20260725000021_realtime.sql
│   └── seed.sql                    # aseguradoras/supplier_routes demo + 1 contacto + insurance_products
└── web/                            # Next.js App Router → Vercel
    ├── app/
    │   ├── kanban/page.tsx
    │   └── contacts/[id]/page.tsx
    ├── components/
    │   ├── KanbanBoard.tsx / KanbanColumn.tsx / OpportunityCard.tsx
    │   ├── ContactTimeline.tsx / TimelineItem.tsx / QuoteRequestsPanel.tsx
    │   └── ui/ (Badge, Card, Chip, Avatar, Toast)
    ├── lib/supabase.ts             # browser client, anon key, URL puerto alterno
    ├── lib/stages.ts               # espejo de los 8 stages + labels ES/EN + colores
    ├── lib/i18n.ts
    └── styles/design-tokens.css    # colors_and_type.css → EN
```
El `crm` del backend Notifiica NO va aquí — el recable (`crmLight.ts`, `mirrorTimeline.ts`, env) vive en `notifiica-supa-langgraph/supabase/functions/`.

### 5.2 Stack
- Front: Next.js 15.5.9 App Router + `@supabase/supabase-js` 2.106.1 (mismas versiones ya probadas en `notifiica-app-front`). Sin BFF, sin GraphQL/OAuth (a diferencia de Twenty). `@dnd-kit/core` para el kanban.
- CRM: Postgres/PostgREST/Realtime de Supabase. Sin auth (anon key).
- Backend recable: Deno edge functions existentes de Notifiica (solo se añaden 2 archivos + swaps).
- CLIs verificadas: supabase 2.98.2, vercel 54.4.1.

### 5.3 config.toml — puertos +1000 (no chocan con Notifiica 54320-54329/8083)
```toml
project_id = "notifiica-crm-light"
[api]       port = 55321
[db]        port = 55322          # shadow 55320, pooler 55329
[studio]    port = 55323
[inbucket]  port = 55324
[analytics] enabled = false       # 55327 si se habilita
# db inspector 8093
```
| Servicio | Notifiica | CRM light |
|---|---|---|
| API | 54321 | 55321 |
| DB | 54322 | 55322 |
| shadow | 54320 | 55320 |
| pooler | 54329 | 55329 |
| Studio | 54323 | 55323 |
| Inbucket | 54324 | 55324 |
| Analytics | 54327 | 55327 |
| Inspector | 8083 | 8093 |
`project_id` distinto aísla contenedores/volúmenes Docker; los puertos permiten **ambos `supabase start` a la vez**.

### 5.4 Correr local (orden recomendado, minimiza riesgo)
```bash
# 1) CRM local
cd /Users/jhon/Documents/caimandrilo/notifiica/crm-light/supabase
supabase start                       # levanta stack aislado en 553xx
supabase db reset                    # aplica migraciones + seed
# anota anon key + service_role key del output

# 2) Front contra local
cd ../web
# .env.local: NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
npm i && npm run dev                  # localhost:3000 (o 3002 si 3000 ocupado)

# 3) Backend Notifiica → modo light contra CRM local
# supabase/functions/.env del proyecto Notifiica:
#   CRM_BACKEND=light
#   CRM_LIGHT_URL=http://127.0.0.1:55321/rest/v1
#   CRM_LIGHT_SERVICE_KEY=<service_role de crm-light>
# reiniciar `supabase functions serve` de Notifiica

# 4) e2e local (agente + broker + drag manual) contra CRM local
# 5) recién entonces deploy cloud
```

### 5.5 Deploy (Supabase cloud nuevo + Vercel)
```bash
# CRM cloud dedicado
supabase projects create notifiica-crm-light --org-id <ORG> --db-password <PW> --region sa-east-1
cd crm-light/supabase && supabase link --project-ref <NUEVO_REF>
supabase db push                     # migraciones = entregable

# Front → Vercel
cd ../web && vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production        # https://<ref>.supabase.co
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod

# Backend Notifiica → apuntar a CRM cloud
supabase secrets set CRM_BACKEND=light \
  CRM_LIGHT_URL=https://<ref>.supabase.co/rest/v1 \
  CRM_LIGHT_SERVICE_KEY=<service_role cloud>   # en el proyecto oaqwztzvkgmhfncwysfc
supabase functions deploy            # crmLight + mirror + swaps
```
Migraciones de CRM-light NUNCA se mezclan con `notifiica-supa-langgraph/supabase/migrations/` (proyecto e historial distintos). El seed solo pone estructura de referencia (aseguradoras/rutas/producto demo + 1 contacto) — coherente con "migraciones = solo estructura del sistema".

---

## Riesgos aceptados (flageados, no implícitos)
1. **Sin auth = tablas públicas** (lectura total + 2 writes anon). OK para demo con datos de prueba, no para PII real. Las policies acotadas dejan endurecerlo post-hackathon sin tocar el front.
2. **Mirror de mensajes/llamadas es best-effort async:** si CRM-light cae, el agente sigue; el timeline queda incompleto hasta que vuelva.
3. **`normalize_phone_e164()` se reconstruye** en el proyecto nuevo (función pura, sin deps; portar cuerpo exacto de mig 20260604000001).
4. **Etapas/estados/estrategias hardcodeados como CHECK** — si el backend agrega un valor nuevo, hay que migrar el CHECK (mismo acoplamiento que hoy existe con Twenty).

Orden de construcción: 1) migraciones+seed local → 2) front kanban+timeline vs local → 3) `crmLight.ts`+`mirrorTimeline.ts`+swaps vs local → 4) e2e local (agente+broker+drag) → 5) deploy cloud+Vercel al final.
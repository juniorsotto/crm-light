# CRM Light — Colsubsidio

CRM ligero para el reto de **Venta Automatizada de Seguros** (Hackathon Colsubsidio × 30X).
Tablero de pipeline en vivo (8 etapas), lista de leads con activación proactiva (▶ Play) y
línea de tiempo por contacto que consolida TODO el movimiento (mensajes, llamadas, cotizaciones,
cambios de etapa).

## Estructura

- `supabase/` — proyecto Supabase independiente (**el entregable de datos**): migraciones,
  `seed.sql` y `config.toml`. Corre en local en los puertos +1000 (API `55321`, DB `55322`).
- `web/` — front Next.js 15 (App Router) + `@supabase/supabase-js` (realtime) + `@dnd-kit`.
- `SPEC.md` — especificación canónica (modelo de datos, RLS, timeline, recable, branding).

## Arranque local

```bash
# 1) Datos
cd supabase && supabase start        # API en :55321, DB en :55322

# 2) Front
cd ../web && cp .env.example .env.local   # completa las claves
npm install && npm run dev                 # http://localhost:3007
```

## Notas

- **Sin autenticación** (demo). RLS abierta: lectura anónima total + escrituras anónimas acotadas
  (mover etapa en `opportunities`, insertar `notes`).
- **Branding Colsubsidio** (azul `#0067B1`, amarillo `#FFD000`). Cero marca de terceros en la UI.
- El backend de Notifiica **empuja** los eventos de mensajería/llamadas a `timeline_events`
  (mirror); el CRM no lee el sistema del agente. Ver `SPEC.md`.

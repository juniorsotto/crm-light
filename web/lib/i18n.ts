/** Centralized copy (ES default; hackathon is in Bogotá). SPEC §4. */

export type Lang = "es" | "en";

export const DEFAULT_LANG: Lang = "es";

type Dict = Record<string, { es: string; en: string }>;

const T: Dict = {
  app_name: { es: "Seguros", en: "Insurance" },
  nav_pipeline: { es: "Pipeline", en: "Pipeline" },
  nav_kanban: { es: "Tablero", en: "Board" },
  nav_leads: { es: "Leads", en: "Leads" },
  live: { es: "En vivo", en: "Live" },

  // leads view
  leads_title: { es: "Leads etiquetados", en: "Tagged leads" },
  leads_sub: {
    es: "Top del embudo · audiencias del motor de propensión",
    en: "Top of funnel · propensity-engine audiences",
  },
  leads_loading: { es: "Cargando leads…", en: "Loading leads…" },
  leads_empty: { es: "Sin leads etiquetados todavía", en: "No tagged leads yet" },
  leads_empty_filtered: {
    es: "Ningún lead en esta categoría",
    en: "No leads in this category",
  },
  leads_search: {
    es: "Buscar por nombre, teléfono o etiqueta…",
    en: "Search by name, phone or tag…",
  },
  lead_one: { es: "lead", en: "lead" },
  lead_many: { es: "leads", en: "leads" },
  suggested: { es: "Sugerido", en: "Suggested" },
  th_lead: { es: "Lead", en: "Lead" },
  th_phone: { es: "Teléfono", en: "Phone" },
  th_audiences: { es: "Audiencias", en: "Audiences" },
  th_suggested: { es: "Producto sugerido", en: "Suggested product" },
  th_added: { es: "Ingreso", en: "Added" },
  th_action: { es: "Acción", en: "Action" },
  no_tags: { es: "Sin etiquetas", en: "No tags" },

  // proactive play (activate lead → agent starts the outreach)
  play_start: { es: "Activar", en: "Activate" },
  play_activating: { es: "Activando…", en: "Activating…" },
  play_done: { es: "Contactado", en: "Contacted" },
  play_skipped: { es: "Ya en el pipe", en: "Already in pipe" },
  play_error: { es: "Error", en: "Error" },
  play_title: {
    es: "Notifiica lo contacta e inicia la oportunidad",
    en: "Notifiica contacts them and starts the opportunity",
  },

  // category filter
  filter_all: { es: "Todas", en: "All" },
  filter_category: { es: "Categoría", en: "Category" },

  kanban_title: { es: "Pipeline de oportunidades", en: "Opportunities pipeline" },
  kanban_empty: { es: "Sin oportunidades", en: "No opportunities" },
  kanban_loading: { es: "Cargando tablero…", en: "Loading board…" },
  col_count_one: { es: "oportunidad", en: "opportunity" },
  col_count_many: { es: "oportunidades", en: "opportunities" },

  move_failed: { es: "No se pudo mover la tarjeta", en: "Could not move the card" },
  move_ok: { es: "Movida a", en: "Moved to" },

  no_phone: { es: "Sin teléfono", en: "No phone" },
  no_amount: { es: "Sin monto", en: "No amount" },

  back_to_board: { es: "Volver al tablero", en: "Back to board" },
  contact_not_found: { es: "Contacto no encontrado", en: "Contact not found" },
  loading: { es: "Cargando…", en: "Loading…" },

  quotes_title: { es: "Cotizaciones", en: "Quote requests" },
  quotes_empty: { es: "Aún no hay cotizaciones", en: "No quote requests yet" },
  premium: { es: "Prima", en: "Premium" },

  timeline_title: { es: "Actividad", en: "Timeline" },
  timeline_empty: { es: "Sin actividad todavía", en: "No activity yet" },
  note_placeholder: { es: "Escribe una nota…", en: "Write a note…" },
  note_send: { es: "Agregar", en: "Add" },
  note_sending: { es: "Guardando…", en: "Saving…" },

  active_stage: { es: "Etapa activa", en: "Active stage" },
  no_active_opp: { es: "Sin oportunidad activa", en: "No active opportunity" },

  // timeline verbs
  tl_moved_to: { es: "Movió a", en: "Moved to" },
  tl_quote_requested: { es: "Solicitó cotización a", en: "Requested a quote from" },
  tl_quote_delivered: { es: "Cotización entregada", en: "Quote delivered" },
  tl_contact_created: { es: "Contacto creado", en: "Contact created" },
  tl_opp_created: { es: "Oportunidad creada", en: "Opportunity created" },
  tl_call: { es: "Llamada", en: "Call" },
  tl_call_ended: { es: "Llamada finalizada", en: "Call ended" },
  tl_muted: { es: "Silenciado", en: "Muted" },
  tl_unmuted: { es: "Reactivado", en: "Unmuted" },
  tl_note: { es: "Nota", en: "Note" },
  tl_task: { es: "Tarea", en: "Task" },
  duration: { es: "duración", en: "duration" },
};

export function makeT(lang: Lang) {
  return (key: keyof typeof T | string): string => {
    const entry = T[key as string];
    if (!entry) return key as string;
    return entry[lang];
  };
}

/** Quote-request status short labels (ES/EN). */
export function quoteStatusLabel(status: string, lang: Lang): string {
  const map: Record<string, { es: string; en: string }> = {
    PENDING: { es: "Pendiente", en: "Pending" },
    SENT: { es: "Enviada", en: "Sent" },
    REMINDED: { es: "Recordada", en: "Reminded" },
    RESPONDED: { es: "Respondida", en: "Responded" },
    QUOTED: { es: "Cotizada", en: "Quoted" },
    NEEDS_CLIENT_INFO: { es: "Falta info", en: "Needs info" },
    INFO_REQUESTED: { es: "Info pedida", en: "Info requested" },
    RESENT: { es: "Reenviada", en: "Resent" },
    NEEDS_INTERNAL_ACTION: { es: "Acción interna", en: "Internal action" },
    NEEDS_REVIEW: { es: "En revisión", en: "In review" },
    DELIVERED: { es: "Entregada", en: "Delivered" },
    EXPIRED: { es: "Vencida", en: "Expired" },
    FAILED: { es: "Fallida", en: "Failed" },
    CANCELLED: { es: "Cancelada", en: "Cancelled" },
  };
  return map[status]?.[lang] ?? status;
}

/** Quote-request status → semantic color tone. */
export function quoteStatusTone(status: string): "neutral" | "info" | "success" | "warn" | "danger" {
  switch (status) {
    case "DELIVERED":
    case "QUOTED":
    case "RESPONDED":
      return "success";
    case "SENT":
    case "REMINDED":
    case "RESENT":
      return "info";
    case "PENDING":
    case "NEEDS_CLIENT_INFO":
    case "INFO_REQUESTED":
    case "NEEDS_INTERNAL_ACTION":
    case "NEEDS_REVIEW":
      return "warn";
    case "EXPIRED":
    case "FAILED":
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

import type { Stage } from "./stages";

export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  /** audience-tag slugs assigned by the propensity engine (see audience_tags). */
  tags?: string[];
  created_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: Stage;
  amount: number | null;
  currency: string;
  /** insurance line slug (vida | vehiculo | hogar | mascota | exequial | salud). */
  category?: string | null;
  point_of_contact_id: string | null;
  created_at: string;
  contacts?: Contact | null;
}

/** Catalog row: one audience label the propensity engine can assign. */
export interface AudienceTag {
  slug: string;
  label_es: string;
  label_en: string;
  description: string | null;
  color: string;
  recommended_product: string | null;
  category: string | null;
  sort: number;
}

export interface QuoteRequest {
  id: string;
  name: string | null;
  request_code: string | null;
  status: string;
  channel: string | null;
  supplier_name?: string | null;
  premium_quoted: number | null;
  plan_name: string | null;
  contact_phone: string | null;
  route_id: string | null;
  created_at: string;
  /** joined from supplier_routes(route_id) on read; absent on realtime deltas. */
  route?: { supplier_name: string | null } | null;
}

export type TimelineKind =
  | "message_in"
  | "message_out"
  | "call_started"
  | "call_ended"
  | "muted"
  | "unmuted"
  | "contact_created"
  | "opportunity_created"
  | "stage_changed"
  | "quote_requested"
  | "quote_status"
  | "quote_delivered"
  | "note"
  | "task";

export type Actor =
  | "customer"
  | "agent"
  | "advisor"
  | "human"
  | "system"
  | "supplier";

export interface TimelineEvent {
  id: number;
  contact_phone: string;
  contact_id: string | null;
  opportunity_id: string | null;
  kind: TimelineKind;
  actor: Actor | null;
  title: string | null;
  body: string | null;
  meta: Record<string, unknown> | null;
  occurred_at: string;
}

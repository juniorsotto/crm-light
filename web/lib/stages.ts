/** Mirror of the 8 opportunity stages (SPEC §1.2 / §4.1).
 *  Order = canonical pipeline order shown in the kanban. */

export type Stage =
  | "PROPENSION"
  | "CONTACTADO"
  | "CONVERSANDO"
  | "COTIZANDO"
  | "COTIZADO"
  | "ACEPTADO"
  | "ESCALADO_ASESOR"
  | "DESCARTADO";

export interface StageMeta {
  key: Stage;
  es: string;
  en: string;
  /** CSS color tokens for the stage chip / column accent. */
  fg: string;
  bg: string;
  /** solid accent used for the column header rail. */
  accent: string;
  /** stages that pulse in the UI (active broker work). */
  pulse?: boolean;
}

export const STAGES: StageMeta[] = [
  {
    key: "PROPENSION",
    es: "Propensión",
    en: "Propensity",
    fg: "var(--fg-2)",
    bg: "var(--bg-hover)",
    accent: "var(--neutral-400)",
  },
  {
    key: "CONTACTADO",
    es: "Contactado",
    en: "Contacted",
    fg: "var(--fg-link)",
    bg: "var(--bg-blue-soft)",
    accent: "var(--brand-blue)",
  },
  {
    key: "CONVERSANDO",
    es: "Conversando",
    en: "In conversation",
    fg: "var(--teal-dark)",
    bg: "var(--bg-teal-soft)",
    accent: "var(--teal)",
  },
  {
    key: "COTIZANDO",
    es: "Cotizando",
    en: "Quoting",
    fg: "#B4780A",
    bg: "var(--bg-warning-soft)",
    accent: "var(--warning)",
    pulse: true,
  },
  {
    key: "COTIZADO",
    es: "Cotizado",
    en: "Quoted",
    fg: "#946000",
    bg: "var(--bg-warning-soft)",
    accent: "#D98A00",
  },
  {
    key: "ACEPTADO",
    es: "Aceptado",
    en: "Accepted",
    fg: "var(--fg-brand)",
    bg: "var(--bg-success-soft)",
    accent: "var(--success)",
  },
  {
    key: "ESCALADO_ASESOR",
    es: "Escalado a asesor",
    en: "Escalated to advisor",
    fg: "var(--violet)",
    bg: "var(--bg-violet-soft)",
    accent: "var(--violet)",
  },
  {
    key: "DESCARTADO",
    es: "Descartado",
    en: "Discarded",
    fg: "var(--fg-3)",
    bg: "var(--bg-subtle)",
    accent: "var(--neutral-300)",
  },
];

export const STAGE_MAP: Record<Stage, StageMeta> = Object.fromEntries(
  STAGES.map((s) => [s.key, s])
) as Record<Stage, StageMeta>;

export function stageLabel(key: string | null | undefined, lang: "es" | "en"): string {
  if (!key) return "";
  const m = STAGE_MAP[key as Stage];
  return m ? m[lang] : key;
}

export function stageMeta(key: string | null | undefined): StageMeta | undefined {
  if (!key) return undefined;
  return STAGE_MAP[key as Stage];
}

export const STAGE_KEYS: Stage[] = STAGES.map((s) => s.key);

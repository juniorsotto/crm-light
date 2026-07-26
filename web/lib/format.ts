import type { Contact } from "./types";
import type { Lang } from "./i18n";

const copFmt = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number | null | undefined, currency = "COP"): string | null {
  if (amount == null) return null;
  if (currency === "COP") return copFmt.format(amount);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function contactName(c: Contact | null | undefined): string {
  if (!c) return "—";
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.phone || "—";
}

export function initials(c: Contact | null | undefined): string {
  if (!c) return "?";
  const f = (c.first_name || "").trim();
  const l = (c.last_name || "").trim();
  if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || "?";
  const p = (c.phone || "").replace(/\D/g, "");
  return p.slice(-2) || "?";
}

/** Relative timestamp, coarse (es/en). */
export function relativeTime(iso: string, lang: Lang): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((then - now) / 1000); // negative = past
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString(lang === "es" ? "es-CO" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

export function clockTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang === "es" ? "es-CO" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "";
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

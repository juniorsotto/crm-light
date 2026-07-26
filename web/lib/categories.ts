/** Canonical insurance lines (categories).
 *  Both `audience_tags.category` and `opportunities.category` draw from this
 *  taxonomy; the category filter over the kanban + leads renders these. */

import type { Lang } from "./i18n";

export interface CategoryMeta {
  slug: string;
  es: string;
  en: string;
  /** brand-adjacent hex; drives the chip tint + dot. */
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: "vida", es: "Vida", en: "Life", color: "#0067B1" },
  { slug: "vehiculo", es: "Vehículo/SOAT", en: "Vehicle/SOAT", color: "#6366F1" },
  { slug: "hogar", es: "Hogar", en: "Home", color: "#16A34A" },
  { slug: "mascota", es: "Mascota", en: "Pet", color: "#0E9AA8" },
  { slug: "exequial", es: "Exequial", en: "Funeral", color: "#64748B" },
  { slug: "salud", es: "Salud", en: "Health", color: "#8B5CF6" },
];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

export function categoryMeta(slug: string | null | undefined): CategoryMeta | undefined {
  if (!slug) return undefined;
  return CATEGORY_MAP[slug];
}

export function categoryLabel(slug: string | null | undefined, lang: Lang): string {
  const m = categoryMeta(slug);
  return m ? m[lang] : (slug ?? "");
}

/** Keep a set of present category slugs in canonical order (for the filter bar). */
export function orderedCategories(present: Iterable<string>): CategoryMeta[] {
  const set = new Set(present);
  return CATEGORIES.filter((c) => set.has(c.slug));
}

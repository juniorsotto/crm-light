import type { AudienceTag } from "./types";

/** #RRGGBB (or #RGB) -> rgba(); used for soft chip tints that stay readable in
 *  both light and dark themes (dot carries the saturated color, bg is a wash). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Distinct category slugs a lead belongs to, via its audience tags. */
export function leadCategories(
  tags: string[] | undefined,
  catalog: Map<string, AudienceTag>
): Set<string> {
  const out = new Set<string>();
  for (const slug of tags ?? []) {
    const cat = catalog.get(slug)?.category;
    if (cat) out.add(cat);
  }
  return out;
}

/** Highest-priority (lowest sort) tag that carries a recommended product — the one that drives the
 *  "suggested product" cell AND the proactive Play (which audience angle to pitch on). Falls back to
 *  the first tag when none recommend a product, so Play always has a tag to hand the agent. */
export function primaryTagFor(
  tags: string[] | undefined,
  catalog: Map<string, AudienceTag>
): AudienceTag | null {
  let best: AudienceTag | null = null;
  for (const slug of tags ?? []) {
    const tag = catalog.get(slug);
    if (tag?.recommended_product && (!best || tag.sort < best.sort)) best = tag;
  }
  if (best) return best;
  for (const slug of tags ?? []) {
    const tag = catalog.get(slug);
    if (tag) return tag;
  }
  return null;
}

/** Highest-priority (lowest sort) recommended product slug across a lead's tags. */
export function recommendedProductFor(
  tags: string[] | undefined,
  catalog: Map<string, AudienceTag>
): string | null {
  let best: AudienceTag | null = null;
  for (const slug of tags ?? []) {
    const tag = catalog.get(slug);
    if (tag?.recommended_product && (!best || tag.sort < best.sort)) best = tag;
  }
  return best?.recommended_product ?? null;
}

import styles from "./ui.module.css";
import { stageMeta } from "@/lib/stages";
import type { Lang } from "@/lib/i18n";
import { stageLabel } from "@/lib/stages";
import { categoryMeta } from "@/lib/categories";
import { hexToRgba } from "@/lib/audience";
import type { AudienceTag } from "@/lib/types";

/** Stage chip — colored per the stage token, optional live pulse. */
export function StageChip({
  stage,
  lang,
}: {
  stage: string | null | undefined;
  lang: Lang;
}) {
  const meta = stageMeta(stage);
  if (!meta) return null;
  return (
    <span
      className={styles.chip}
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span
        className={`${styles.chipDot} ${meta.pulse ? styles.chipPulse : ""}`}
        style={{ background: meta.accent }}
      />
      {stageLabel(stage, lang)}
    </span>
  );
}

/** Audience-tag chip — colored per the catalog color, tint + dot. */
export function AudienceChip({ tag, lang }: { tag: AudienceTag; lang: Lang }) {
  const label = lang === "es" ? tag.label_es : tag.label_en;
  return (
    <span
      className={styles.chip}
      style={{ background: hexToRgba(tag.color, 0.13), color: "var(--fg-1)" }}
      title={tag.description ?? undefined}
    >
      <span className={styles.chipDot} style={{ background: tag.color }} />
      {label}
    </span>
  );
}

/** Fallback chip for a raw slug not present in the catalog. */
export function RawTagChip({ slug }: { slug: string }) {
  return (
    <span
      className={styles.chip}
      style={{ background: "var(--bg-hover)", color: "var(--fg-2)" }}
    >
      <span className={styles.chipDot} style={{ background: "var(--neutral-400)" }} />
      {slug}
    </span>
  );
}

/** Insurance-category chip. `sm` = compact variant for the kanban card. */
export function CategoryChip({
  slug,
  lang,
  sm = false,
}: {
  slug: string | null | undefined;
  lang: Lang;
  sm?: boolean;
}) {
  const meta = categoryMeta(slug);
  if (!meta) return null;
  return (
    <span
      className={styles.chip}
      style={{
        background: hexToRgba(meta.color, 0.13),
        color: "var(--fg-1)",
        ...(sm ? { padding: "1px 8px", fontSize: "var(--fs-11)" } : {}),
      }}
    >
      <span
        className={styles.chipDot}
        style={{ background: meta.color, ...(sm ? { width: 6, height: 6 } : {}) }}
      />
      {meta[lang]}
    </span>
  );
}

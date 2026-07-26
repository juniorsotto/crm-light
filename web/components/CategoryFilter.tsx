"use client";

import styles from "./category-filter.module.css";
import { useApp } from "./AppContext";
import { hexToRgba } from "@/lib/audience";
import type { CategoryMeta } from "@/lib/categories";

/** Single-select insurance-category filter bar. `value === null` = "Todas". */
export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: CategoryMeta[];
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  const { t, lang } = useApp();
  if (categories.length === 0) return null;

  return (
    <div className={styles.bar} role="group" aria-label={t("filter_category")}>
      <button
        type="button"
        className={`${styles.chip} ${value === null ? styles.active : ""}`}
        onClick={() => onChange(null)}
        aria-pressed={value === null}
      >
        {t("filter_all")}
      </button>
      {categories.map((c) => {
        const active = value === c.slug;
        return (
          <button
            key={c.slug}
            type="button"
            className={`${styles.chip} ${active ? styles.active : ""}`}
            onClick={() => onChange(active ? null : c.slug)}
            aria-pressed={active}
            style={
              active
                ? { background: hexToRgba(c.color, 0.16), borderColor: c.color, color: "var(--fg-1)" }
                : undefined
            }
          >
            <span className={styles.dot} style={{ background: c.color }} />
            {c[lang]}
          </button>
        );
      })}
    </div>
  );
}

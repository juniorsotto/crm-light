"use client";

import { useDroppable } from "@dnd-kit/core";
import styles from "@/app/kanban/kanban.module.css";
import { OpportunityCard } from "./OpportunityCard";
import { useApp } from "./AppContext";
import type { StageMeta } from "@/lib/stages";
import type { Opportunity } from "@/lib/types";

export function KanbanColumn({
  meta,
  opps,
}: {
  meta: StageMeta;
  opps: Opportunity[];
}) {
  const { lang, t } = useApp();
  const { setNodeRef, isOver } = useDroppable({ id: meta.key });

  return (
    <section
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
    >
      <header className={styles.colHead}>
        <span className={styles.colRail} style={{ background: meta.accent }} />
        <span className={styles.colName}>{meta[lang]}</span>
        <span className={styles.colCount}>{opps.length}</span>
      </header>
      <div className={styles.colBody}>
        {opps.length === 0 ? (
          <div className={styles.colEmpty}>{t("kanban_empty")}</div>
        ) : (
          opps.map((o) => <OpportunityCard key={o.id} opp={o} />)
        )}
      </div>
    </section>
  );
}

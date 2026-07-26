"use client";

import styles from "./kanban.module.css";
import { AppHeader } from "@/components/AppHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useApp } from "@/components/AppContext";

export default function KanbanPage() {
  const { t } = useApp();
  return (
    <>
      <AppHeader live />
      <div className={styles.page}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{t("kanban_title")}</h1>
        </div>
        <KanbanBoard />
      </div>
    </>
  );
}

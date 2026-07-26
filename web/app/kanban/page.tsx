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
          <a
            className={styles.waCta}
            href="https://wa.me/12079774078?text=Hola%2C%20quiero%20cotizar%20un%20seguro%20con%20Colsubsidio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className={styles.waIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.49 0 1.46 1.07 2.88 1.22 3.08.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12 2.04C6.55 2.04 2.12 6.47 2.12 11.92c0 1.74.46 3.44 1.32 4.94L2.04 22l5.28-1.38c1.45.79 3.08 1.21 4.68 1.21 5.45 0 9.88-4.43 9.88-9.88S17.45 2.04 12 2.04zm0 18.09c-1.44 0-2.85-.39-4.08-1.12l-.29-.17-3.03.79.81-2.95-.19-.3a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23z" />
            </svg>
            <span className={styles.waCtaText}>
              <strong>{t("wa_cta_title")}</strong>
              <small>{t("wa_cta_sub")}</small>
            </span>
          </a>
        </div>
        <KanbanBoard />
      </div>
    </>
  );
}

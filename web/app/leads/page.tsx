"use client";

import styles from "./leads.module.css";
import { AppHeader } from "@/components/AppHeader";
import { LeadsList } from "@/components/LeadsList";
import { useApp } from "@/components/AppContext";

export default function LeadsPage() {
  const { t } = useApp();
  return (
    <>
      <AppHeader live />
      <div className={styles.page}>
        <div className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{t("leads_title")}</h1>
          <span className={styles.pageSub}>{t("leads_sub")}</span>
        </div>
        <LeadsList />
      </div>
    </>
  );
}

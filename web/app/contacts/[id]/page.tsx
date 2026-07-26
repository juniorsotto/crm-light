"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./contact.module.css";
import { AppHeader } from "@/components/AppHeader";
import { useApp } from "@/components/AppContext";
import { Avatar } from "@/components/ui/Avatar";
import { StageChip } from "@/components/ui/Chip";
import { ContactTimeline } from "@/components/ContactTimeline";
import { QuoteRequestsPanel } from "@/components/QuoteRequestsPanel";
import { supabase } from "@/lib/supabase";
import { contactName, initials, formatMoney } from "@/lib/format";
import type { Contact, Opportunity } from "@/lib/types";

export default function ContactPage() {
  const { t, lang } = useApp();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const { data: c } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      setContact((c as unknown as Contact) ?? null);

      const { data: opps } = await supabase
        .from("opportunities")
        .select("*")
        .eq("point_of_contact_id", id)
        .order("created_at", { ascending: false });
      if (!alive) return;
      const list = (opps as unknown as Opportunity[]) ?? [];
      const active =
        list.find((o) => o.stage !== "DESCARTADO") ?? list[0] ?? null;
      setActiveOpp(active);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <>
      <AppHeader />
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link href="/kanban" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("back_to_board")}
          </Link>
        </div>

        {loading ? (
          <div className={styles.centerFull}>{t("loading")}</div>
        ) : !contact ? (
          <div className={styles.centerFull}>{t("contact_not_found")}</div>
        ) : (
          <>
            <header className={styles.header}>
              <Avatar initials={initials(contact)} size={56} />
              <div className={styles.headerInfo}>
                <h1 className={styles.headerName}>{contactName(contact)}</h1>
                <div className={styles.headerMeta}>
                  <span className={`${styles.metaItem} ${styles.metaMono}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {contact.phone}
                  </span>
                  {contact.email && (
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </svg>
                      {contact.email}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.headerRight}>
                {activeOpp ? (
                  <>
                    <StageChip stage={activeOpp.stage} lang={lang} />
                    {formatMoney(activeOpp.amount, activeOpp.currency) && (
                      <span className={styles.headerAmount}>
                        {formatMoney(activeOpp.amount, activeOpp.currency)}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "var(--fg-4)", fontSize: "var(--fs-12)" }}>
                    {t("no_active_opp")}
                  </span>
                )}
              </div>
            </header>

            <div className={styles.body}>
              <div className={styles.timelineCol}>
                <ContactTimeline phone={contact.phone} contactId={contact.id} />
              </div>
              <aside className={styles.sideCol}>
                <QuoteRequestsPanel phone={contact.phone} />
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}

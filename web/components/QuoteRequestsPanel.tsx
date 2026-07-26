"use client";

import { useEffect, useState } from "react";
import styles from "@/app/contacts/[id]/contact.module.css";
import { Badge, type Tone } from "./ui/Badge";
import { useApp } from "./AppContext";
import { supabase } from "@/lib/supabase";
import { quoteStatusLabel, quoteStatusTone } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import type { QuoteRequest } from "@/lib/types";

const toneMap: Record<string, Tone> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warn: "warn",
  danger: "danger",
};

export function QuoteRequestsPanel({ phone }: { phone: string }) {
  const { t, lang } = useApp();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("quote_requests")
        .select("*,route:route_id(supplier_name)")
        .eq("contact_phone", phone)
        .order("created_at", { ascending: false });
      if (!alive) return;
      setQuotes((data as unknown as QuoteRequest[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [phone]);

  // realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`quotes-${phone}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quote_requests",
          filter: `contact_phone=eq.${phone}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as QuoteRequest;
            setQuotes((xs) => xs.filter((q) => q.id !== old.id));
            return;
          }
          const row = payload.new as QuoteRequest;
          setQuotes((xs) => {
            const idx = xs.findIndex((q) => q.id === row.id);
            if (idx === -1) return [row, ...xs];
            const next = xs.slice();
            next[idx] = { ...next[idx], ...row };
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone]);

  return (
    <div>
      <h2 className={styles.sideTitle}>{t("quotes_title")}</h2>
      {loading ? (
        <div className={styles.qEmpty}>{t("loading")}</div>
      ) : quotes.length === 0 ? (
        <div className={styles.qEmpty}>{t("quotes_empty")}</div>
      ) : (
        <div className={styles.qList}>
          {quotes.map((q) => (
            <div key={q.id} className={styles.qCard}>
              <div className={styles.qTop}>
                <span className={styles.qCode}>{q.request_code ?? "—"}</span>
                <Badge tone={toneMap[quoteStatusTone(q.status)]}>
                  {quoteStatusLabel(q.status, lang)}
                </Badge>
              </div>
              {(q.route?.supplier_name || q.supplier_name) && (
                <span className={styles.qSupplier}>
                  {q.route?.supplier_name || q.supplier_name}
                </span>
              )}
              {q.plan_name && (
                <div className={styles.qRow}>
                  <span className={styles.qLabel}>{q.plan_name}</span>
                </div>
              )}
              <div className={styles.qRow}>
                <span className={styles.qLabel}>{t("premium")}</span>
                <span className={styles.qPremium}>
                  {formatMoney(q.premium_quoted) ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import styles from "@/app/contacts/[id]/contact.module.css";
import { useApp } from "./AppContext";
import { clockTime, formatDuration, formatMoney, relativeTime } from "@/lib/format";
import { stageLabel, stageMeta } from "@/lib/stages";
import { quoteStatusLabel } from "@/lib/i18n";
import type { TimelineEvent } from "@/lib/types";

function meta<T = unknown>(e: TimelineEvent, key: string): T | undefined {
  return (e.meta ?? {})[key] as T | undefined;
}

export function TimelineItem({ event }: { event: TimelineEvent }) {
  const { lang, t } = useApp();
  const e = event;

  switch (e.kind) {
    case "message_in":
    case "message_out": {
      const out = e.kind === "message_out";
      return (
        <div className={`${styles.bubbleRow} ${out ? styles.bubbleRowOut : ""}`}>
          <div className={`${styles.bubble} ${out ? styles.bubbleOut : styles.bubbleIn}`}>
            {e.body}
            <span className={styles.bubbleMeta}>{clockTime(e.occurred_at, lang)}</span>
          </div>
        </div>
      );
    }

    case "call_started":
    case "call_ended": {
      const dur = meta<number>(e, "duration_seconds") ?? meta<number>(e, "duration");
      const label = e.kind === "call_ended" ? t("tl_call_ended") : t("tl_call");
      return (
        <div className={styles.item} style={{ justifyContent: "center" }}>
          <span className={styles.callChip}>
            <span aria-hidden>📞</span>
            {label}
            {dur != null && ` · ${formatDuration(dur)}`}
          </span>
        </div>
      );
    }

    case "stage_changed": {
      const to = meta<string>(e, "to");
      const m = stageMeta(to);
      return (
        <div className={styles.sysLine}>
          <span
            className={styles.sysAccent}
            style={{ color: m?.fg }}
          >
            → {t("tl_moved_to")} {stageLabel(to, lang)}
          </span>
          <span className={styles.itemTime}>{relativeTime(e.occurred_at, lang)}</span>
        </div>
      );
    }

    case "quote_requested": {
      const supplier = meta<string>(e, "supplier_name") ?? e.title;
      return (
        <div className={`${styles.evCard} ${styles.evCardAccent}`}>
          <span className={styles.evIcon} style={{ background: "var(--bg-warning-soft)" }} aria-hidden>📄</span>
          <div className={styles.evBody}>
            <div className={styles.evTitle}>
              {t("tl_quote_requested")} {supplier ?? ""}
            </div>
            {meta<string>(e, "request_code") && (
              <div className={styles.evText}>{meta<string>(e, "request_code")}</div>
            )}
            <div className={styles.evTime}>{relativeTime(e.occurred_at, lang)}</div>
          </div>
        </div>
      );
    }

    case "quote_status": {
      const code = meta<string>(e, "request_code");
      const status = meta<string>(e, "status") ?? "";
      return (
        <div className={styles.sysLine}>
          <span className={styles.sysAccent}>
            {code ? `${code}: ` : ""}
            {quoteStatusLabel(status, lang)}
          </span>
          <span className={styles.itemTime}>{relativeTime(e.occurred_at, lang)}</span>
        </div>
      );
    }

    case "quote_delivered": {
      const premium = meta<number>(e, "premium") ?? meta<number>(e, "premium_quoted");
      return (
        <div className={`${styles.evCard} ${styles.evCardAccent}`}>
          <span className={styles.evIcon} style={{ background: "var(--bg-success-soft)" }} aria-hidden>✅</span>
          <div className={styles.evBody}>
            <div className={styles.evTitle}>{t("tl_quote_delivered")}</div>
            {premium != null && (
              <div className={styles.evText}>{formatMoney(premium)}</div>
            )}
            <div className={styles.evTime}>{relativeTime(e.occurred_at, lang)}</div>
          </div>
        </div>
      );
    }

    case "note":
    case "task": {
      const isTask = e.kind === "task";
      return (
        <div className={styles.evCard}>
          <span
            className={styles.evIcon}
            style={{ background: isTask ? "var(--bg-blue-soft)" : "var(--bg-hover)" }}
            aria-hidden
          >
            {isTask ? "☑️" : "📝"}
          </span>
          <div className={styles.evBody}>
            <div className={styles.evTitle}>{e.title ?? (isTask ? t("tl_task") : t("tl_note"))}</div>
            {e.body && <div className={styles.evText}>{e.body}</div>}
            <div className={styles.evTime}>{relativeTime(e.occurred_at, lang)}</div>
          </div>
        </div>
      );
    }

    // system-ish, tenue
    case "muted":
    case "unmuted":
    case "contact_created":
    case "opportunity_created":
    default: {
      const label =
        e.title ??
        (e.kind === "contact_created"
          ? t("tl_contact_created")
          : e.kind === "opportunity_created"
          ? t("tl_opp_created")
          : e.kind === "muted"
          ? t("tl_muted")
          : e.kind === "unmuted"
          ? t("tl_unmuted")
          : e.kind);
      return (
        <div className={`${styles.sysLine} ${styles.tenue}`}>
          <span className={styles.sysIcon} aria-hidden>·</span>
          <span>{label}</span>
          <span className={styles.itemTime}>{relativeTime(e.occurred_at, lang)}</span>
        </div>
      );
    }
  }
}

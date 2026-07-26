"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/contacts/[id]/contact.module.css";
import { TimelineItem } from "./TimelineItem";
import { useApp } from "./AppContext";
import { useToast } from "./ui/Toast";
import { supabase } from "@/lib/supabase";
import type { TimelineEvent } from "@/lib/types";

export function ContactTimeline({
  phone,
  contactId,
}: {
  phone: string;
  contactId: string;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("contact_phone", phone)
        .order("occurred_at", { ascending: true });
      if (!alive) return;
      setEvents((data as unknown as TimelineEvent[]) ?? []);
      setLoading(false);
      scrollToBottom();
    })();
    return () => {
      alive = false;
    };
  }, [phone, scrollToBottom]);

  // realtime filtered by contact_phone
  useEffect(() => {
    const channel = supabase
      .channel(`timeline-${phone}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_events",
          filter: `contact_phone=eq.${phone}`,
        },
        (payload) => {
          const row = payload.new as TimelineEvent;
          setEvents((xs) => {
            if (xs.some((e) => e.id === row.id)) return xs;
            return [...xs, row].sort(
              (a, b) =>
                new Date(a.occurred_at).getTime() -
                new Date(b.occurred_at).getTime()
            );
          });
          scrollToBottom();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [phone, scrollToBottom]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const { error } = await supabase
      .from("notes")
      .insert({ body, contact_id: contactId });
    setSending(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setDraft("");
    // note appears via realtime (trigger emits timeline_events row)
  };

  return (
    <>
      <div className={styles.tlHead}>
        <span className={styles.tlHeadTitle}>{t("timeline_title")}</span>
      </div>
      <div className={styles.tlScroll} ref={scrollRef}>
        {loading ? (
          <div className={styles.tlEmpty}>{t("loading")}</div>
        ) : events.length === 0 ? (
          <div className={styles.tlEmpty}>{t("timeline_empty")}</div>
        ) : (
          events.map((e) => <TimelineItem key={e.id} event={e} />)
        )}
      </div>
      <div className={styles.composer}>
        <input
          className={styles.composerInput}
          placeholder={t("note_placeholder")}
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && !ev.shiftKey) {
              ev.preventDefault();
              submit();
            }
          }}
        />
        <button
          className={styles.composerBtn}
          onClick={submit}
          disabled={!draft.trim() || sending}
        >
          {sending ? t("note_sending") : t("note_send")}
        </button>
      </div>
    </>
  );
}

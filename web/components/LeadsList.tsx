"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/leads/leads.module.css";
import { Avatar } from "./ui/Avatar";
import { AudienceChip, RawTagChip } from "./ui/Chip";
import { CategoryFilter } from "./CategoryFilter";
import { useApp } from "./AppContext";
import { supabase } from "@/lib/supabase";
import { contactName, initials, relativeTime } from "@/lib/format";
import { leadCategories, primaryTagFor, recommendedProductFor } from "@/lib/audience";
import { orderedCategories } from "@/lib/categories";
import type { AudienceTag, Contact } from "@/lib/types";

/** Per-lead Play state: idle → activating → done | skipped | error. */
type PlayState = "idle" | "activating" | "done" | "skipped" | "error";

export function LeadsList() {
  const { t, lang } = useApp();
  const router = useRouter();

  const [leads, setLeads] = useState<Contact[]>([]);
  const [catalog, setCatalog] = useState<Map<string, AudienceTag>>(new Map());
  const [products, setProducts] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  // Play (proactive activation) status keyed by contact id — local UI state only.
  const [playState, setPlayState] = useState<Record<string, PlayState>>({});

  // ▶ PLAY PROACTIVO. POST to the server-side route handler (which holds the CALLBACK_SECRET +
  // phone_number_id — never exposed to the browser) with the lead's phone + suggested tag/product.
  // Notifiica's agent then contacts the lead and opens the opportunity; Realtime reflects it on the
  // kanban. Idle → "Activando…" → "Contactado" (or "Ya en el pipe" / error).
  const activate = useCallback(
    async (lead: Contact) => {
      const st = playState[lead.id];
      if (st === "activating" || st === "done" || st === "skipped") return;
      const tag = primaryTagFor(lead.tags, catalog);
      setPlayState((s) => ({ ...s, [lead.id]: "activating" }));
      try {
        const res = await fetch("/api/activate-lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contact_phone: lead.phone,
            tag: tag?.slug ?? null,
            product: tag?.recommended_product ?? recommendedProductFor(lead.tags, catalog),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; skipped?: string };
        if (!res.ok || data.ok === false) {
          setPlayState((s) => ({ ...s, [lead.id]: "error" }));
          return;
        }
        setPlayState((s) => ({
          ...s,
          [lead.id]: data.skipped === "already_active" ? "skipped" : "done",
        }));
      } catch {
        setPlayState((s) => ({ ...s, [lead.id]: "error" }));
      }
    },
    [playState, catalog]
  );

  const withTags = (rows: Contact[]) =>
    rows.filter((c) => (c.tags?.length ?? 0) > 0);

  const load = useCallback(async () => {
    const [{ data: contacts }, { data: tags }, { data: prods }] = await Promise.all([
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("audience_tags").select("*").order("sort", { ascending: true }),
      supabase.from("insurance_products").select("slug,name"),
    ]);
    setLeads(withTags((contacts as unknown as Contact[]) ?? []));
    setCatalog(
      new Map(((tags as unknown as AudienceTag[]) ?? []).map((t) => [t.slug, t]))
    );
    setProducts(
      new Map(
        (((prods as unknown as { slug: string; name: string }[]) ?? []).map(
          (p) => [p.slug, p.name]
        ))
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: a tag change (contacts UPDATE) makes the row appear / re-render.
  // This is the seam the grok next-best-action step will hook into.
  useEffect(() => {
    const channel = supabase
      .channel("leads-contacts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        async (payload) => {
          const row = (payload.new ?? payload.old) as Contact;
          if (payload.eventType === "DELETE") {
            setLeads((xs) => xs.filter((c) => c.id !== row.id));
            return;
          }
          const { data } = await supabase
            .from("contacts")
            .select("*")
            .eq("id", row.id)
            .maybeSingle();
          const full = (data as unknown as Contact) ?? row;
          setLeads((xs) => {
            const has = (full.tags?.length ?? 0) > 0;
            const idx = xs.findIndex((c) => c.id === full.id);
            if (!has) return idx === -1 ? xs : xs.filter((c) => c.id !== full.id);
            if (idx === -1) return [full, ...xs];
            const next = xs.slice();
            next[idx] = { ...next[idx], ...full };
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // filter bar options: only categories present across the current leads' tags
  const availableCategories = useMemo(() => {
    const present = new Set<string>();
    for (const lead of leads)
      for (const cat of leadCategories(lead.tags, catalog)) present.add(cat);
    return orderedCategories(present);
  }, [leads, catalog]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (category && !leadCategories(lead.tags, catalog).has(category)) return false;
      if (!q) return true;
      const hay = [
        contactName(lead),
        lead.phone,
        ...(lead.tags ?? []).flatMap((slug) => {
          const tag = catalog.get(slug);
          return tag ? [tag.slug, tag.label_es, tag.label_en] : [slug];
        }),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, catalog, query, category]);

  const go = (id: string) => router.push(`/contacts/${id}`);

  if (loading) {
    return <div className={styles.center}>{t("leads_loading")}</div>;
  }

  return (
    <>
      <div className={styles.controls}>
        <CategoryFilter
          categories={availableCategories}
          value={category}
          onChange={setCategory}
        />
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("leads_search")}
            aria-label={t("leads_search")}
          />
        </div>
      </div>

      <div className={styles.scroll}>
        {visible.length === 0 ? (
          <div className={styles.center}>
            {leads.length === 0 ? t("leads_empty") : t("leads_empty_filtered")}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thLead}>{t("th_lead")}</th>
                <th className={styles.thPhone}>{t("th_phone")}</th>
                <th className={styles.thTags}>{t("th_audiences")}</th>
                <th className={styles.thProd}>{t("th_suggested")}</th>
                <th className={styles.thDate}>{t("th_added")}</th>
                <th className={styles.thAction}>{t("th_action")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => {
                const recoSlug = recommendedProductFor(lead.tags, catalog);
                const recoName = recoSlug ? products.get(recoSlug) ?? recoSlug : null;
                return (
                  <tr
                    key={lead.id}
                    className={styles.row}
                    onClick={() => go(lead.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") go(lead.id);
                    }}
                  >
                    <td className={styles.tdLead}>
                      <div className={styles.leadCell}>
                        <Avatar initials={initials(lead)} size={38} />
                        <span className={styles.leadName}>{contactName(lead)}</span>
                      </div>
                    </td>
                    <td className={styles.tdPhone}>
                      <span className={styles.phone}>{lead.phone}</span>
                    </td>
                    <td className={styles.tdTags}>
                      <div className={styles.tags}>
                        {(lead.tags ?? []).map((slug) => {
                          const tag = catalog.get(slug);
                          return tag ? (
                            <AudienceChip key={slug} tag={tag} lang={lang} />
                          ) : (
                            <RawTagChip key={slug} slug={slug} />
                          );
                        })}
                      </div>
                    </td>
                    <td className={styles.tdProd}>
                      {recoName ? (
                        <span className={styles.reco}>
                          <span className={styles.recoLabel}>{t("suggested")}</span>
                          {recoName}
                        </span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                    </td>
                    <td className={styles.tdDate}>
                      <span className={styles.date}>
                        {relativeTime(lead.created_at, lang)}
                      </span>
                    </td>
                    <td className={styles.tdAction}>
                      {(() => {
                        const ps = playState[lead.id] ?? "idle";
                        const cls =
                          ps === "activating"
                            ? styles.busy
                            : ps === "done"
                            ? styles.done
                            : ps === "skipped"
                            ? styles.skipped
                            : ps === "error"
                            ? styles.error
                            : "";
                        const label =
                          ps === "activating"
                            ? t("play_activating")
                            : ps === "done"
                            ? t("play_done")
                            : ps === "skipped"
                            ? t("play_skipped")
                            : ps === "error"
                            ? t("play_error")
                            : t("play_start");
                        return (
                          <button
                            type="button"
                            className={`${styles.playBtn} ${cls}`}
                            title={t("play_title")}
                            disabled={ps === "activating" || ps === "done" || ps === "skipped"}
                            onClick={(e) => {
                              e.stopPropagation();
                              activate(lead);
                            }}
                          >
                            {(ps === "idle" || ps === "error") && (
                              <svg className={styles.playIcon} viewBox="0 0 24 24" aria-hidden>
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                            {label}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

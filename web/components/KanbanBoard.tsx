"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import styles from "@/app/kanban/kanban.module.css";
import { KanbanColumn } from "./KanbanColumn";
import { OpportunityCard } from "./OpportunityCard";
import { CategoryFilter } from "./CategoryFilter";
import { useApp } from "./AppContext";
import { useToast } from "./ui/Toast";
import { supabase } from "@/lib/supabase";
import { STAGES, stageLabel, type Stage } from "@/lib/stages";
import { orderedCategories } from "@/lib/categories";
import type { Opportunity } from "@/lib/types";

const SELECT = "*,contacts:point_of_contact_id(*)";

export function KanbanBoard() {
  const { t, lang } = useApp();
  const { toast } = useToast();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // keep a ref of current opps for rollback without stale closure
  const oppsRef = useRef<Opportunity[]>([]);
  oppsRef.current = opps;

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (!error && data) setOpps(data as unknown as Opportunity[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: opportunities INSERT / UPDATE / DELETE
  useEffect(() => {
    const channel = supabase
      .channel("kanban-opps")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "opportunities" },
        async (payload) => {
          const row = (payload.new ?? payload.old) as Opportunity;
          if (payload.eventType === "DELETE") {
            setOpps((xs) => xs.filter((o) => o.id !== row.id));
            return;
          }
          // realtime payloads don't include the joined contact — refetch the row
          const { data } = await supabase
            .from("opportunities")
            .select(SELECT)
            .eq("id", row.id)
            .maybeSingle();
          const full = (data as unknown as Opportunity) ?? row;
          setOpps((xs) => {
            const idx = xs.findIndex((o) => o.id === full.id);
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

  // category filter bar options: only lines present in the current opportunities
  const availableCategories = useMemo(
    () => orderedCategories(opps.map((o) => o.category).filter(Boolean) as string[]),
    [opps]
  );

  const byStage = useMemo(() => {
    const groups: Record<string, Opportunity[]> = {};
    for (const s of STAGES) groups[s.key] = [];
    const shown = category ? opps.filter((o) => o.category === category) : opps;
    for (const o of shown) {
      (groups[o.stage] ?? (groups[o.stage] = [])).push(o);
    }
    return groups;
  }, [opps, category]);

  const activeOpp = activeId
    ? opps.find((o) => o.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const oppId = String(active.id);
    const target = String(over.id) as Stage;
    const current = oppsRef.current.find((o) => o.id === oppId);
    if (!current || current.stage === target) return;

    const prevStage = current.stage;

    // optimistic
    setOpps((xs) =>
      xs.map((o) => (o.id === oppId ? { ...o, stage: target } : o))
    );

    const { error } = await supabase
      .from("opportunities")
      .update({ stage: target })
      .eq("id", oppId);

    if (error) {
      // rollback
      setOpps((xs) =>
        xs.map((o) => (o.id === oppId ? { ...o, stage: prevStage } : o))
      );
      toast(t("move_failed"), "error");
    } else {
      toast(`${t("move_ok")} ${stageLabel(target, lang)}`, "success");
    }
  };

  if (loading) {
    return <div className={styles.center}>{t("kanban_loading")}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <CategoryFilter
        categories={availableCategories}
        value={category}
        onChange={setCategory}
      />
      <div className={styles.boardScroll}>
        <div className={styles.board}>
          {STAGES.map((meta) => (
            <KanbanColumn
              key={meta.key}
              meta={meta}
              opps={byStage[meta.key] ?? []}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeOpp ? <OpportunityCard opp={activeOpp} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

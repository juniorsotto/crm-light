"use client";

import { useRouter } from "next/navigation";
import { useDraggable } from "@dnd-kit/core";
import styles from "@/app/kanban/kanban.module.css";
import { CategoryChip } from "./ui/Chip";
import { contactName, formatMoney } from "@/lib/format";
import { useApp } from "./AppContext";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({
  opp,
  overlay = false,
}: {
  opp: Opportunity;
  overlay?: boolean;
}) {
  const { lang, t } = useApp();
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opp.id,
    data: { opp },
    disabled: overlay,
  });

  const contact = opp.contacts ?? null;
  const money = formatMoney(opp.amount, opp.currency);
  const quoting = opp.stage === "COTIZANDO";

  const goToContact = () => {
    if (contact?.id) router.push(`/contacts/${contact.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ""} ${
        overlay ? styles.cardOverlay : ""
      }`}
      {...listeners}
      {...attributes}
      onClick={goToContact}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") goToContact();
      }}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardContact}>{contactName(contact)}</span>
        {opp.category && (
          <span className={styles.cardCat}>
            <CategoryChip slug={opp.category} lang={lang} sm />
          </span>
        )}
      </div>

      <span className={styles.cardName}>{opp.name}</span>

      {money ? (
        <span className={styles.cardAmount}>{money}</span>
      ) : (
        <span className={styles.cardAmountEmpty}>{t("no_amount")}</span>
      )}

      {quoting && (
        <div className={styles.cardFooter}>
          <span className={styles.quoting}>
            <span className={styles.spinner} />
          </span>
        </div>
      )}
    </div>
  );
}

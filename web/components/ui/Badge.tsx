import type { ReactNode } from "react";
import styles from "./ui.module.css";

export type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "violet";

const toneClass: Record<Tone, string> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warn: styles.toneWarn,
  danger: styles.toneDanger,
  violet: styles.toneViolet,
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`${styles.badge} ${toneClass[tone]}`}>{children}</span>;
}

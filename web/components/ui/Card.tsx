import type { CSSProperties, ReactNode } from "react";
import styles from "./ui.module.css";

export function Card({
  children,
  pad = true,
  className = "",
  style,
}: {
  children: ReactNode;
  pad?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`${styles.card} ${pad ? styles.cardPad : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

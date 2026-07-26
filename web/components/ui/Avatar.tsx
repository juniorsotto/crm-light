import styles from "./ui.module.css";

export function Avatar({
  initials,
  size = 40,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

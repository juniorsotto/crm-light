"use client";

import styles from "./PropensityEngine.module.css";
import { useApp } from "./AppContext";

/**
 * Decorative "propensity engine" band shown above the leads list.
 *
 * Concept, readable at a glance:
 *   - Meshing gears (opposite spin) = the ML motor processing.
 *   - Source chips (other Colsubsidio products: credit, pharmacy, housing,
 *     IPS, Piscilago, hotels…) flow in from the left, feeding the motor.
 *   - Lead "particles" are emitted from the motor and drop down toward the
 *     real list below — as if the motor is generating leads into it.
 *
 * Purely visual: no data, no fetch. Marked aria-hidden (ambient decoration)
 * and honors prefers-reduced-motion (gears still, no particles) via the
 * component's CSS module.
 */

type Src = { key: string; top: string; left: string; delay: string };

const SOURCES: Src[] = [
  { key: "src_credits", top: "30%", left: "2%", delay: "0s" },
  { key: "src_pharmacy", top: "52%", left: "17%", delay: "0.9s" },
  { key: "src_housing", top: "74%", left: "6%", delay: "1.8s" },
  { key: "src_ips", top: "30%", left: "25%", delay: "2.6s" },
  { key: "src_piscilago", top: "52%", left: "9%", delay: "3.5s" },
  { key: "src_hotels", top: "74%", left: "23%", delay: "4.4s" },
  { key: "src_etc", top: "30%", left: "41%", delay: "5.2s" },
];

const PARTICLES: { left: string; delay: string }[] = [
  { left: "16%", delay: "0s" },
  { left: "46%", delay: "1.1s" },
  { left: "28%", delay: "2.2s" },
  { left: "54%", delay: "3.3s" },
];

/** A single meshing gear drawn centered at (cx, cy); spun by its wrapping <g>. */
function gearGroup(cx: number, cy: number, r: number, teeth: number, colorClass: string) {
  const w = r * 0.44;
  const h = r * 0.52;
  const step = 360 / teeth;
  return (
    <g className={colorClass}>
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={cx - w / 2}
          y={cy - r - h * 0.35}
          width={w}
          height={h}
          rx={Math.max(1, w * 0.3)}
          transform={`rotate(${step * i} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.34} className={styles.hub} />
      <circle cx={cx} cy={cy} r={r * 0.13} />
    </g>
  );
}

export function PropensityEngine() {
  const { t } = useApp();

  return (
    <div className={styles.band} role="presentation" aria-hidden="true">
      <div className={styles.caption}>
        <span className={styles.captionDot} />
        {t("pe_status")}
      </div>

      {/* data sources flowing into the motor */}
      <div className={styles.sources}>
        {SOURCES.map((s) => (
          <span
            key={s.key}
            className={styles.srcChip}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            <span className={styles.srcDot} />
            {t(s.key)}
          </span>
        ))}
      </div>

      {/* the motor: meshing gears */}
      <div className={styles.engine}>
        <svg
          className={styles.engineSvg}
          viewBox="0 0 120 96"
          preserveAspectRatio="xMidYMid meet"
        >
          <g className={`${styles.gear} ${styles.spinCw}`}>
            {gearGroup(46, 54, 26, 12, styles.gearBlue)}
          </g>
          <g
            className={`${styles.gear} ${styles.spinCcw}`}
            style={{ animationDuration: "6.5s" }}
          >
            {gearGroup(85, 39, 18, 10, styles.gearBlue2)}
          </g>
          <g
            className={`${styles.gear} ${styles.spinCw}`}
            style={{ animationDuration: "4.5s" }}
          >
            {gearGroup(72, 73, 12, 8, styles.gearYellow)}
          </g>
        </svg>
      </div>

      {/* output: generated leads dropping toward the list */}
      <div className={styles.output}>
        <svg
          className={styles.outArrow}
          width="18"
          height="34"
          viewBox="0 0 18 34"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 2v22" />
          <path d="M3 18l6 6 6-6" />
        </svg>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{ left: p.left, animationDelay: p.delay }}
          >
            <span className={styles.pAvatar} />
            <span className={styles.pLines}>
              <span />
              <span />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

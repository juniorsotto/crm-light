"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";

export function AppHeader({ live }: { live?: boolean }) {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const pathname = usePathname();
  const onKanban = pathname === "/" || pathname.startsWith("/kanban");
  const onLeads = pathname.startsWith("/leads");

  return (
    <header className="app-header">
      <Link href="/kanban" className="app-brand" style={{ textDecoration: "none" }}>
        <span className="app-brand-mark">
          <img src="/colsubsidio-mark.png" alt="Colsubsidio" width={28} height={28} />
        </span>
        Colsubsidio <span style={{ color: "var(--fg-3)", fontWeight: 600 }}>· {t("app_name")}</span>
      </Link>

      <nav className="app-nav">
        <Link href="/leads" className={onLeads ? "active" : ""}>
          {t("nav_leads")}
        </Link>
        <Link href="/kanban" className={onKanban ? "active" : ""}>
          {t("nav_pipeline")}
        </Link>
      </nav>

      <div className="app-header-spacer" />

      {live && (
        <span className="live-badge">
          <span className="live-dot" />
          {t("live")}
        </span>
      )}

      <button
        className="theme-toggle"
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        title="ES / EN"
        aria-label="Toggle language"
        style={{ fontWeight: 700, fontSize: 12, width: "auto", padding: "0 10px" }}
      >
        {lang.toUpperCase()}
      </button>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title="Theme"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </button>
    </header>
  );
}

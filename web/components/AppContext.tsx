"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LANG, makeT, type Lang } from "@/lib/i18n";

type Theme = "light" | "dark";

interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  theme: Theme;
  toggleTheme: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [theme, setTheme] = useState<Theme>("light");

  // hydrate persisted prefs
  useEffect(() => {
    const savedLang = (localStorage.getItem("crm.lang") as Lang) || DEFAULT_LANG;
    const savedTheme = (localStorage.getItem("crm.theme") as Theme) || "light";
    setLangState(savedLang);
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("lang", savedLang);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("crm.lang", l);
    document.documentElement.setAttribute("lang", l);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("crm.theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: makeT(lang), theme, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}

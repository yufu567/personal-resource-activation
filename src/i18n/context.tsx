"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { translations, type Locale } from "./translations";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const stored = localStorage.getItem("pra-locale") as Locale | null;
    if (stored === "zh" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("pra-locale", l);
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (path: string) => {
      const node = getNestedValue(translations, path);
      if (node && typeof node === "object" && "zh" in node) {
        return (node as Record<Locale, string>)[locale];
      }
      return path;
    },
    [locale],
  );

  return <I18nContext value={{ locale, setLocale, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

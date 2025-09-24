"use client";

import React from "react";
import i18nInstance from "@/lib/i18n/config";
import { I18nextProvider, useTranslation } from "react-i18next";
import type { SupportedLocale } from "@/lib/i18n/config";

type I18nProviderProps = {
  children: React.ReactNode;
};

export function I18nProvider({
  children,
}: I18nProviderProps): React.ReactElement {
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

export function useI18n(): {
  t: ReturnType<typeof useTranslation>["t"];
  locale: string;
  changeLocale: (lng: SupportedLocale) => Promise<void>;
} {
  const { t, i18n } = useTranslation();
  async function changeLocale(lng: SupportedLocale): Promise<void> {
    if (i18n.language === lng) return;
    await i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("i18nextLng", lng);
        const html = document.querySelector("html");
        if (html) html.setAttribute("lang", lng);
      } catch {}
    }
  }
  return { t, locale: i18n.resolvedLanguage ?? i18n.language, changeLocale };
}

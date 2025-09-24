"use client";

import i18n, { type InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/common.json";
import hi from "./locales/hi/common.json";
import pa from "./locales/pa/common.json";

export type SupportedLocale = "en" | "hi" | "pa";

export const defaultNamespace: string = "common";
export const supportedLocales: SupportedLocale[] = ["en", "hi", "pa"];

const resources = {
  en: { common: en },
  hi: { common: hi },
  pa: { common: pa },
} as const;

const options: InitOptions = {
  resources,
  fallbackLng: "en",
  supportedLngs: supportedLocales,
  defaultNS: defaultNamespace,
  ns: [defaultNamespace],
  interpolation: { escapeValue: false },
  detection: {
    order: ["localStorage", "navigator", "htmlTag"],
    caches: ["localStorage"],
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(options)
    .catch(() => {
      // no-op: avoid crashing app if init fails in edge cases
    });
}

export default i18n;



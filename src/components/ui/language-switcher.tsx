"use client";

import React from "react";
import { supportedLocales, type SupportedLocale } from "@/lib/i18n/config";
import { useI18n } from "@/context/i18n-provider";

export default function LanguageSwitcher(): React.ReactElement {
  const { locale, changeLocale } = useI18n();
  return (
    <div className="flex items-center gap-2 text-sm">
      {supportedLocales.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-pressed={locale === lng}
          onClick={() => void changeLocale(lng as SupportedLocale)}
          className={
            "px-2 py-1 rounded border transition-colors " +
            (locale === lng
              ? "bg-black text-white border-black"
              : "bg-white text-black border-gray-300 hover:bg-gray-50")
          }
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}



"use client";

import React from "react";
import { useI18n } from "@/context/i18n-provider";
import { type SupportedLocale } from "@/lib/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocaleOption = {
  code: SupportedLocale;
  name: string;
  glyph: string; // "A" | "अ" | "ਅ"
};

const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en", name: "English", glyph: "A" },
  { code: "hi", name: "हिन्दी", glyph: "अ" },
  { code: "pa", name: "ਪੰਜਾਬੀ", glyph: "ਅ" },
];

export default function LanguageSwitcher(): React.ReactElement {
  const { locale, changeLocale } = useI18n();

  const current =
    LOCALE_OPTIONS.find((o) => o.code === (locale as SupportedLocale)) ??
    LOCALE_OPTIONS[0];

  return (
    <Select
      value={current.code}
      onValueChange={(value) => void changeLocale(value as SupportedLocale)}
    >
      <SelectTrigger aria-label="Select language" size="sm">
        <span className="flex items-center gap-2">
          <SelectValue placeholder={current.name} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {LOCALE_OPTIONS.map((opt) => (
          <SelectItem key={opt.code} value={opt.code}>
            <span className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border text-xs font-semibold">
                {opt.glyph}
              </span>
              <span>{opt.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

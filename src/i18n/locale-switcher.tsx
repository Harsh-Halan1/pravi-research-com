"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { setLocale } from "./actions";
import type { Locale } from "./request";

const options: { value: Locale; nativeName: string }[] = [
  { value: "en", nativeName: "English" },
  { value: "hi", nativeName: "हिन्दी" },
  { value: "bn", nativeName: "বাংলা" },
  { value: "mr", nativeName: "मराठी" },
  { value: "gu", nativeName: "ગુજરાતી" },
];

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const id = useId();

  return (
    <form action={setLocale} className="locale-switcher">
      <label htmlFor={id}>{t("language")}</label>
      <select
        id={id}
        name="locale"
        value={locale}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        aria-label={t("language")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.nativeName}
          </option>
        ))}
      </select>
    </form>
  );
}

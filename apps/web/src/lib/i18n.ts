import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import plTranslation from "../../../../packages/shared/src/i18n/pl/translation.json";
import enTranslation from "../../../../packages/shared/src/i18n/en/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: plTranslation },
      en: { translation: enTranslation },
    },
    fallbackLng: "pl",
    supportedLngs: ["pl", "en"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

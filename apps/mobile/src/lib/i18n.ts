import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Inline translations for React Native (can't use dynamic JSON imports on native)
const pl = {
  auth: {
    login: "Zaloguj się",
    logout: "Wyloguj",
    email: "Email",
    password: "Hasło",
    forgotPassword: "Zapomniałem hasła",
    resetPassword: "Resetuj hasło",
  },
  nav: {
    dashboard: "Strona główna",
    attendance: "Obecność",
    menu: "Jadłospis",
    messages: "Wiadomości",
    billing: "Płatności",
  },
  messages: {
    regarding: "Dot. {{kidName}}",
    typeMessage: "Napisz wiadomość...",
  },
};

const en = {
  auth: {
    login: "Log in",
    logout: "Log out",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password",
    resetPassword: "Reset password",
  },
  nav: {
    dashboard: "Dashboard",
    attendance: "Attendance",
    menu: "Menu",
    messages: "Messages",
    billing: "Billing",
  },
  messages: {
    regarding: "Re: {{kidName}}",
    typeMessage: "Write a message...",
  },
};

i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl }, en: { translation: en } },
  lng: "pl",
  fallbackLng: "pl",
  interpolation: { escapeValue: false },
});

export default i18n;

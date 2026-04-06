import {
  format,
  getISOWeek,
  getYear,
  parseISO,
  startOfISOWeek,
  addDays,
} from "date-fns";
import { pl, enUS } from "date-fns/locale";

// ─── Currency ────────────────────────────────────────
/** Converts grosze (integer PLN cents) to formatted PLN string: 4500 → "45,00 zł" */
export function formatPLN(grosze: number): string {
  const pln = grosze / 100;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(pln);
}

/** Converts PLN float to grosze integer: 45.00 → 4500 */
export function plnToGrosze(pln: number): number {
  return Math.round(pln * 100);
}

// ─── Dates ───────────────────────────────────────────
/** Returns ISO week string: "2025-W08" */
export function getWeekId(date: Date): string {
  const week = getISOWeek(date);
  const year = getYear(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Returns date string: "2025-02-22" */
export function getDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Returns all 5 weekday Dates for a given week ID "2025-W08" */
export function getWeekDates(weekId: string): Date[] {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const week1Start = startOfISOWeek(jan4);
  const targetMonday = addDays(week1Start, (week - 1) * 7);
  return Array.from({ length: 5 }, (_, i) => addDays(targetMonday, i));
}

/** Format a date for display */
export function formatDate(date: Date, locale: "pl" | "en" = "pl"): string {
  return format(date, "PPP", { locale: locale === "pl" ? pl : enUS });
}

/** Format date as "Mon, Feb 22" */
export function formatShortDate(
  date: Date,
  locale: "pl" | "en" = "pl",
): string {
  return format(date, "EEE, d MMM", { locale: locale === "pl" ? pl : enUS });
}

// ─── Slugs ───────────────────────────────────────────
/** Converts a preschool name to a URL-safe code */
export function nameToCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 30);
}

// ─── Attendance ──────────────────────────────────────
/** Calculates number of present days from an attendance record map */
export function countPresentDays(
  entries: Record<string, { status: string }>,
): number {
  return Object.values(entries).filter(
    (e) => e.status === "present" || e.status === "late",
  ).length;
}

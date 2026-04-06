"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPLN = formatPLN;
exports.plnToGrosze = plnToGrosze;
exports.getWeekId = getWeekId;
exports.getDateStr = getDateStr;
exports.getWeekDates = getWeekDates;
exports.formatDate = formatDate;
exports.formatShortDate = formatShortDate;
exports.nameToCode = nameToCode;
exports.countPresentDays = countPresentDays;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
// ─── Currency ────────────────────────────────────────
/** Converts grosze (integer PLN cents) to formatted PLN string: 4500 → "45,00 zł" */
function formatPLN(grosze) {
    const pln = grosze / 100;
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
    }).format(pln);
}
/** Converts PLN float to grosze integer: 45.00 → 4500 */
function plnToGrosze(pln) {
    return Math.round(pln * 100);
}
// ─── Dates ───────────────────────────────────────────
/** Returns ISO week string: "2025-W08" */
function getWeekId(date) {
    const week = (0, date_fns_1.getISOWeek)(date);
    const year = (0, date_fns_1.getYear)(date);
    return `${year}-W${String(week).padStart(2, "0")}`;
}
/** Returns date string: "2025-02-22" */
function getDateStr(date) {
    return (0, date_fns_1.format)(date, "yyyy-MM-dd");
}
/** Returns all 5 weekday Dates for a given week ID "2025-W08" */
function getWeekDates(weekId) {
    const [yearStr, weekStr] = weekId.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    const week1Start = (0, date_fns_1.startOfISOWeek)(jan4);
    const targetMonday = (0, date_fns_1.addDays)(week1Start, (week - 1) * 7);
    return Array.from({ length: 5 }, (_, i) => (0, date_fns_1.addDays)(targetMonday, i));
}
/** Format a date for display */
function formatDate(date, locale = "pl") {
    return (0, date_fns_1.format)(date, "PPP", { locale: locale === "pl" ? locale_1.pl : locale_1.enUS });
}
/** Format date as "Mon, Feb 22" */
function formatShortDate(date, locale = "pl") {
    return (0, date_fns_1.format)(date, "EEE, d MMM", { locale: locale === "pl" ? locale_1.pl : locale_1.enUS });
}
// ─── Slugs ───────────────────────────────────────────
/** Converts a preschool name to a URL-safe code */
function nameToCode(name) {
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
function countPresentDays(entries) {
    return Object.values(entries).filter((e) => e.status === "present" || e.status === "late").length;
}
//# sourceMappingURL=index.js.map
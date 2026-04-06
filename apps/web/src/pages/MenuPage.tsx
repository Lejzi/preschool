import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, PenLine, Loader2, BookOpen } from "lucide-react";
import { clsx } from "clsx";
import { format, addWeeks, subWeeks, startOfISOWeek, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import type { WeekDay, MealType } from "@przedszkole/shared";
import { useWeeklyMenu } from "@/hooks/useMenu";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { useAuthStore } from "@/stores/authStore";
import { useKids } from "@/hooks/useKids";
import { FOOD_ALLERGY_OPTIONS, isPresetFoodAllergy } from "@/lib/foodNeeds";

const WEEK_DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const MEAL_TYPES: MealType[] = [
  "breakfast",
  "second_breakfast",
  "lunch",
  "dessert",
  "snack",
];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "II Śniadanie",
  lunch: "Obiad",
  dessert: "Deser",
  snack: "Podwieczorek",
};

const DAY_NAMES: Record<WeekDay, string> = {
  monday: "Poniedziałek",
  tuesday: "Wtorek",
  wednesday: "Środa",
  thursday: "Czwartek",
  friday: "Piątek",
};

export function MenuPage() {
  const { t } = useTranslation();
  const { role, preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const { preschoolCode } = useParams();
  const { userProfile } = useAuthStore();
  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));

  const weekDates = WEEK_DAYS.map((_, i) => addDays(weekStart, i));
  const isStaff = role === "admin" || role === "teacher" || role === "superadmin";

  const { data: weeklyMenu, isLoading } = useWeeklyMenu(preschoolId || "", weekStart);
  const { data: allKids = [] } = useKids(preschoolId || "");
  const menuDays = weeklyMenu?.days || {};
  const parentRelevantAllergies = useMemo(() => {
    if (role !== "parent" || !userProfile) return [];

    const linkedKids = allKids.filter(
      (kid) =>
        kid.parentIds?.includes(userProfile.id) ||
        userProfile.linkedKidIds?.includes(kid.id),
    );

    return Array.from(
      new Set(
        linkedKids.flatMap((kid) =>
          (kid.allergies || []).filter(isPresetFoodAllergy),
        ),
      ),
    );
  }, [allKids, role, userProfile]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("menu.weeklyMenu")}</h1>
        {isStaff && (
          <Link to={`/${preschoolCode}/menu/builder`} className="btn-primary">
            <PenLine size={16} />
            {t("menu.builder")}
          </Link>
        )}
      </div>

      {/* Week navigation */}
      <div className="card flex items-center justify-between py-3">
        <button
          onClick={() => setWeekStart((d) => subWeeks(d, 1))}
          className="btn-ghost p-2"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-slate-800">
          {format(weekStart, "d MMM", { locale: pl })} –{" "}
          {format(addDays(weekStart, 4), "d MMM yyyy", { locale: pl })}
        </p>
        <button
          onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          className="btn-ghost p-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : !weeklyMenu ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Brak ułożonego jadłospisu na ten tydzień.</p>
          {isStaff && (
            <Link to={`/${preschoolCode}/menu/builder`} className="text-brand-600 hover:underline mt-2 inline-block">
              Przejdź do kreatora, aby go utworzyć
            </Link>
          )}
        </div>
      ) : (
        /* Menu table */
        <div className="overflow-x-auto">
          <div
            className="grid gap-4 min-w-[640px]"
            style={{ gridTemplateColumns: `140px repeat(5, 1fr)` }}
          >
            {/* Header row */}
            <div />
            {WEEK_DAYS.map((day, i) => (
              <div
                key={day}
                className={clsx(
                  "text-center py-2 px-3 rounded-xl",
                  format(weekDates[i], "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                    ? "bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/20"
                    : "bg-slate-50 border border-slate-100 text-slate-700 font-medium",
                )}
              >
                <p className="text-sm">{DAY_NAMES[day]}</p>
                <p className="text-xs opacity-75">
                  {format(weekDates[i], "d.MM")}
                </p>
              </div>
            ))}

            {/* Meal rows */}
            {MEAL_TYPES.map((meal) => (
              <div className="contents" key={`row-${meal}`}>
                <div key={`label-${meal}`} className="flex items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {MEAL_LABELS[meal]}
                  </span>
                </div>
                {WEEK_DAYS.map((day) => {
                  const mealItem = menuDays[day]?.[meal];
                  const matchingSpecialMeals = parentRelevantAllergies
                    .map((allergyKey) => ({
                      allergyKey,
                      item: mealItem?.specialDietMeals?.[allergyKey],
                    }))
                    .filter((entry) => entry.item?.name);
                  
                  return (
                    <div
                      key={`${meal}-${day}`}
                      className="card py-3 px-3 min-h-[70px] flex items-center shadow-none border border-slate-100 hover:border-brand-200 transition-colors"
                    >
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {mealItem?.name || mealItem?.description ? (
                          <>
                            {mealItem.name && <span className="block">{mealItem.name}</span>}
                            {mealItem.description && <span className="block text-slate-400 font-normal mt-0.5">{mealItem.description}</span>}
                            {role === "parent" && matchingSpecialMeals.length > 0 && (
                              <span className="mt-2 block rounded-xl border border-brand-100 bg-brand-50 p-2 text-[11px] text-brand-800">
                                <span className="block font-semibold text-brand-900">
                                  {t("menu.specialDietsForChild")}
                                </span>
                                {matchingSpecialMeals.map(({ allergyKey, item }) => (
                                  <span key={allergyKey} className="mt-1 block">
                                    {t(`kids.foodAllergyOptions.${allergyKey}`)}: {item?.name}
                                    {item?.description ? ` · ${item.description}` : ""}
                                  </span>
                                ))}
                              </span>
                            )}
                            {isStaff &&
                              mealItem?.specialDietMeals &&
                              Object.keys(mealItem.specialDietMeals).length > 0 && (
                                <span className="mt-2 flex flex-wrap gap-1">
                                  {FOOD_ALLERGY_OPTIONS.filter(
                                    (allergyKey) => mealItem.specialDietMeals?.[allergyKey]?.name,
                                  ).map((allergyKey) => (
                                    <span
                                      key={allergyKey}
                                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                    >
                                      {t(`kids.foodAllergyOptions.${allergyKey}`)}
                                    </span>
                                  ))}
                                </span>
                              )}
                          </>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { 
  BookMarked, Plus, Loader2, Save, ArrowLeft, Trash2, X, ChevronLeft, ChevronRight, Search
} from "lucide-react";
import { clsx } from "clsx";
import { format, addWeeks, subWeeks, startOfISOWeek, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { Link, useParams } from "react-router-dom";
import type { WeekDay, MealType, Recipe, DayMeals, FoodAllergyKey } from "@przedszkole/shared";
import { useWeeklyMenu, useSaveWeeklyMenu } from "@/hooks/useMenu";
import { useRecipes, useSaveRecipe, useDeleteRecipe } from "@/hooks/useRecipes";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { FOOD_ALLERGY_OPTIONS } from "@/lib/foodNeeds";

const WEEK_DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const MEAL_TYPES: MealType[] = ["breakfast", "second_breakfast", "lunch", "dessert", "snack"];

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

const CAT_LABELS: Record<string, string> = {
  breakfast: "Śniadanie",
  lunch: "Obiad",
  main: "Danie główne",
  soup: "Zupa",
  dessert: "Deser",
  snack: "Przekąska",
};

export function MenuBuilderPage() {
  const { t } = useTranslation();
  const { preschoolCode } = useParams();
  const { userProfile } = useAuthStore();
  const { preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));
  const weekDates = WEEK_DAYS.map((_, i) => addDays(weekStart, i));

  // Data fetching
  const { data: menuData, isLoading: isMenuLoading } = useWeeklyMenu(preschoolId || "", weekStart);
  const { data: recipes = [], isLoading: isRecipesLoading } = useRecipes(preschoolId || "");
  
  const { mutate: saveMenu, isPending: isSavingMenu } = useSaveWeeklyMenu();
  const { mutate: saveRecipe, isPending: isSavingRecipe } = useSaveRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();

  // Local state for builder
  const [localDays, setLocalDays] = useState<Partial<Record<WeekDay, DayMeals>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // New Recipe Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeCat, setNewRecipeCat] = useState<Recipe["category"]>("lunch");
  const [newRecipeIngredients, setNewRecipeIngredients] = useState("");

  // Slot picker modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTarget, setPickerTarget] = useState<{ day: WeekDay; meal: MealType } | null>(null);
  const [specialDietTarget, setSpecialDietTarget] = useState<{ day: WeekDay; meal: MealType } | null>(null);
  const [specialDietDrafts, setSpecialDietDrafts] = useState<
    Record<FoodAllergyKey, { recipeId: string; name: string; description: string }>
  >({
    gluten: { recipeId: "", name: "", description: "" },
    dairy: { recipeId: "", name: "", description: "" },
    egg: { recipeId: "", name: "", description: "" },
    nuts: { recipeId: "", name: "", description: "" },
    soy: { recipeId: "", name: "", description: "" },
    fish: { recipeId: "", name: "", description: "" },
  });

  useEffect(() => {
    let mounted = true;
    if (menuData?.days && mounted) {
      setTimeout(() => {
        setLocalDays(menuData.days);
        setHasUnsavedChanges(false);
      }, 0);
    } else if (mounted) {
      setTimeout(() => {
        setLocalDays({});
        setHasUnsavedChanges(false);
      }, 0);
    }
    return () => { mounted = false; };
  }, [menuData, weekStart]);

  const handleCellClick = (day: WeekDay, meal: MealType) => {
    setPickerTarget({ day, meal });
    setPickerSearch("");
    setIsPickerOpen(true);
  };

  const assignRecipeToSlot = (recipe: Pick<Recipe, "id" | "name">) => {
    if (!pickerTarget) return;
    const { day, meal } = pickerTarget;

    setLocalDays(prev => {
      const prevDay = prev[day] || {};
      return {
        ...prev,
        [day]: {
          ...prevDay,
          [meal]: {
            ...prevDay[meal],
            recipeId: recipe.id,
            name: recipe.name,
          }
        }
      };
    });
    setHasUnsavedChanges(true);
    setIsPickerOpen(false);
    setPickerTarget(null);
  };

  const clearSlot = (day: WeekDay, meal: MealType, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayData = localDays[day] || {};
    const nextDayData = { ...dayData };
    delete nextDayData[meal];
    setLocalDays(prev => ({ ...prev, [day]: nextDayData }));
    setHasUnsavedChanges(true);
  };

  const openSpecialDietModal = (day: WeekDay, meal: MealType, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentSpecialDiets = localDays[day]?.[meal]?.specialDietMeals || {};
    setSpecialDietDrafts({
      gluten: {
        recipeId: currentSpecialDiets.gluten?.recipeId || "",
        name: currentSpecialDiets.gluten?.name || "",
        description: currentSpecialDiets.gluten?.description || "",
      },
      dairy: {
        recipeId: currentSpecialDiets.dairy?.recipeId || "",
        name: currentSpecialDiets.dairy?.name || "",
        description: currentSpecialDiets.dairy?.description || "",
      },
      egg: {
        recipeId: currentSpecialDiets.egg?.recipeId || "",
        name: currentSpecialDiets.egg?.name || "",
        description: currentSpecialDiets.egg?.description || "",
      },
      nuts: {
        recipeId: currentSpecialDiets.nuts?.recipeId || "",
        name: currentSpecialDiets.nuts?.name || "",
        description: currentSpecialDiets.nuts?.description || "",
      },
      soy: {
        recipeId: currentSpecialDiets.soy?.recipeId || "",
        name: currentSpecialDiets.soy?.name || "",
        description: currentSpecialDiets.soy?.description || "",
      },
      fish: {
        recipeId: currentSpecialDiets.fish?.recipeId || "",
        name: currentSpecialDiets.fish?.name || "",
        description: currentSpecialDiets.fish?.description || "",
      },
    });
    setSpecialDietTarget({ day, meal });
  };

  const saveSpecialDietMeals = () => {
    if (!specialDietTarget) return;
    const { day, meal } = specialDietTarget;
    const currentMeal = localDays[day]?.[meal];
    if (!currentMeal) return;

    const nextSpecialDietMeals = Object.fromEntries(
      FOOD_ALLERGY_OPTIONS.flatMap((dietKey) => {
        const draft = specialDietDrafts[dietKey];
        const name = draft.name.trim();
        const description = draft.description.trim();
        if (!name && !description) return [];
        return [[dietKey, { recipeId: draft.recipeId || undefined, name, description: description || undefined }]];
      }),
    ) as NonNullable<typeof currentMeal.specialDietMeals>;

    setLocalDays((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [meal]: {
          ...currentMeal,
          specialDietMeals:
            Object.keys(nextSpecialDietMeals).length > 0 ? nextSpecialDietMeals : undefined,
        },
      },
    }));
    setHasUnsavedChanges(true);
    setSpecialDietTarget(null);
  };

  const handleSaveMenu = () => {
    if (!preschoolId || !userProfile) return;
    const year = parseInt(format(weekStart, "yyyy"), 10);
    const week = parseInt(format(weekStart, "I"), 10); // ISO week number

    saveMenu({
      preschoolId,
      year,
      week,
      days: localDays,
      publishedBy: userProfile.id
    }, {
      onSuccess: () => setHasUnsavedChanges(false)
    });
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !newRecipeName || !userProfile) return;

    saveRecipe({
      preschoolId,
      name: newRecipeName,
      category: newRecipeCat,
      createdBy: userProfile.id,
      ingredients: newRecipeIngredients
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    }, {
      onSuccess: (createdRecipe) => {
        const recipeForSlot = {
          id: createdRecipe.id as string,
          name: createdRecipe.name as string,
        };
        setNewRecipeName("");
        setNewRecipeCat("lunch");
        setNewRecipeIngredients("");
        setIsRecipeModalOpen(false);
        if (pickerTarget) {
          assignRecipeToSlot(recipeForSlot);
        }
      }
    });
  };

  const isLoading = isMenuLoading || isRecipesLoading || isResolvingPreschool;
  const filteredRecipes = recipes.filter((recipe) => {
    const query = pickerSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      recipe.name.toLowerCase().includes(query) ||
      recipe.category.toLowerCase().includes(query) ||
      recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query))
    );
  });
  const recipeOptions = recipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.name,
    description: CAT_LABELS[recipe.category] || recipe.category,
    keywords: [
      recipe.category,
      ...(recipe.ingredients || []),
    ].join(" "),
  }));

  return (
    <div className="space-y-6">
      <div className="page-header justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/${preschoolCode}/menu`} className="btn-ghost p-2 -ml-2 text-slate-400 hover:text-slate-600 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">{t("menu.builder")}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-primary" 
            onClick={handleSaveMenu}
            disabled={isSavingMenu || !hasUnsavedChanges}
          >
            {isSavingMenu ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {hasUnsavedChanges ? "Zapisz menu" : "Zapisane"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT: Recipe library */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                <BookMarked size={14} className="inline mr-1 mb-0.5" />
                {t("menu.recipes")}
              </h2>
              <button 
                className="btn-ghost p-1 text-brand-600" 
                onClick={() => setIsRecipeModalOpen(true)}
                title={t("menu.addRecipe")}
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 pb-4">
              {recipes.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  Brak przepisów. Dodaj pierwsze danie!
                </p>
              ) : (
                recipes.map((r) => {
                  return (
                    <div
                      key={r.id}
                      className="card p-3 flex flex-col gap-1 transition-all border-2 border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-slate-900 text-sm leading-tight pr-2">{r.name}</p>
                        <button 
                          className="text-slate-300 hover:text-red-500 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Usunąć przepis?")) {
                               deleteRecipe({ preschoolId: preschoolId || "", id: r.id });
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {CAT_LABELS[r.category] || r.category}
                      </p>
                      {r.ingredients.length > 0 && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {r.ingredients.slice(0, 3).join(", ")}
                          {r.ingredients.length > 3 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Weekly planner */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-100 p-2 px-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide hidden sm:block">
                🗓️ {t("menu.weeklyMenu")}
              </h2>
              <div className="flex items-center gap-4 mx-auto sm:mx-0">
                <button onClick={() => setWeekStart((d) => subWeeks(d, 1))} className="btn-ghost p-1.5">
                  <ChevronLeft size={18} />
                </button>
                <p className="font-semibold text-slate-800 text-sm min-w-[140px] text-center">
                  {format(weekStart, "d MMM", { locale: pl })} –{" "}
                  {format(addDays(weekStart, 4), "d MMM yyyy", { locale: pl })}
                </p>
                <button onClick={() => setWeekStart((d) => addWeeks(d, 1))} className="btn-ghost p-1.5">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div
                className="grid gap-2 min-w-[700px] select-none"
                style={{ gridTemplateColumns: `100px repeat(5, 1fr)` }}
              >
                {/* Header row */}
                <div />
                {WEEK_DAYS.map((day, i) => (
                  <div key={day} className="text-center py-2 bg-slate-50 border border-slate-200 rounded-t-lg">
                    <p className="text-xs font-semibold text-slate-600">{DAY_NAMES[day]}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{format(weekDates[i], "d.MM")}</p>
                  </div>
                ))}

                {/* Meal rows */}
                {MEAL_TYPES.map((meal) => (
                  <div className="contents" key={`row-${meal}`}>
                    <div className="flex items-center justify-end pr-2 bg-slate-50 border border-slate-100 rounded-l-lg p-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right leading-tight">
                        {MEAL_LABELS[meal]}
                      </span>
                    </div>
                    {WEEK_DAYS.map((day) => {
                      const item = localDays[day]?.[meal];
                      
                      return (
                        <div
                          key={`${meal}-${day}`}
                          onClick={() => handleCellClick(day, meal)}
                          className={clsx(
                            "relative min-h-[72px] cursor-pointer border p-3 transition-all duration-150",
                            item 
                              ? "bg-white border-slate-200 shadow-sm hover:border-red-300 group" 
                              : "bg-slate-50/50 border-slate-100 border-dashed hover:bg-brand-50 hover:border-brand-300"
                          )}
                        >
                          {item ? (
                            <div className="flex min-h-[48px] flex-col justify-between gap-2 pr-5">
                              <p className="text-sm font-medium leading-snug text-slate-700">
                                {item.name}
                              </p>
                              {item.specialDietMeals &&
                                Object.keys(item.specialDietMeals).length > 0 && (
                                  <p className="text-[11px] font-medium text-slate-500">
                                    {Object.keys(item.specialDietMeals)
                                      .map((dietKey) =>
                                        t(`kids.foodAllergyOptions.${dietKey}`),
                                      )
                                      .join(" · ")}
                                  </p>
                                )}
                              <button
                                onClick={(e) => openSpecialDietModal(day, meal, e)}
                                className="inline-flex w-fit cursor-pointer items-center rounded-md px-0 py-0 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                                title={t("menu.specialDiets")}
                              >
                                {t("menu.specialDiets")}
                              </button>
                              <button 
                                onClick={(e) => clearSlot(day, meal, e)}
                                className="absolute top-1 right-1 p-1 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-red-500 transition-opacity"
                                title="Usuń z tego dnia"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="w-full pt-3 text-center opacity-0 transition-opacity hover:opacity-100">
                               <Plus size={16} className="mx-auto text-slate-300" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Recipe Create Modal */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-sm animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t("menu.addRecipe")}</h2>
              <button disabled={isSavingRecipe} className="btn-ghost p-2" onClick={() => setIsRecipeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRecipe} className="space-y-4">
              <div>
                <label className="label">{t("common.name", "Nazwa potrawy")}</label>
                <input
                  required
                  autoFocus
                  className="input"
                  placeholder="np. Zupa pomidorowa z ryżem"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Kategoria</label>
                <Select
                  value={newRecipeCat} 
                  onChange={(value) => setNewRecipeCat(value as Recipe["category"])}
                  options={Object.entries(CAT_LABELS).map(([key, label]) => ({
                    value: key,
                    label,
                  }))}
                />
              </div>

              <div>
                <label className="label">Składniki</label>
                <textarea
                  className="input min-h-32 resize-none"
                  placeholder={"Wpisz po jednym składniku w każdej linii\nnp. marchew\nziemniaki\npietruszka"}
                  value={newRecipeIngredients}
                  onChange={(e) => setNewRecipeIngredients(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" disabled={isSavingRecipe} className="btn-ghost flex-1" onClick={() => setIsRecipeModalOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={isSavingRecipe} className="btn-primary flex-1">
                  {isSavingRecipe ? <Loader2 className="w-4 h-4 animate-spin" /> : "Dodaj do bazy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPickerOpen && pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-2xl animate-fade-in relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Wybierz danie</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {DAY_NAMES[pickerTarget.day]} · {MEAL_LABELS[pickerTarget.meal]}
                </p>
              </div>
              <button className="btn-ghost p-2" onClick={() => setIsPickerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="input pl-9"
                placeholder="Szukaj po nazwie, kategorii lub składniku"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {filteredRecipes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
                  Brak wyników. Dodaj nowe danie do bazy przepisów.
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40"
                    onClick={() => assignRecipeToSlot(recipe)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{recipe.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {CAT_LABELS[recipe.category] || recipe.category}
                        </p>
                      </div>
                    </div>
                    {recipe.ingredients.length > 0 && (
                      <p className="text-sm text-slate-600 mt-2">
                        {recipe.ingredients.join(", ")}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setIsPickerOpen(false)}>
                {t("common.cancel")}
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  setIsPickerOpen(false);
                  setIsRecipeModalOpen(true);
                }}
              >
                Dodaj nowe danie
              </button>
            </div>
          </div>
        </div>
      )}

      {specialDietTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("menu.specialDiets")}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {DAY_NAMES[specialDietTarget.day]} · {MEAL_LABELS[specialDietTarget.meal]}
                </p>
              </div>
              <button className="btn-ghost p-2" onClick={() => setSpecialDietTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-500">{t("menu.specialDietsHint")}</p>
              {FOOD_ALLERGY_OPTIONS.map((dietKey) => (
                <div key={dietKey} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {t(`kids.foodAllergyOptions.${dietKey}`)}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <SearchSelect
                      value={specialDietDrafts[dietKey].recipeId}
                      onChange={(value) => {
                        const selectedRecipe = recipes.find((recipe) => recipe.id === value);
                        setSpecialDietDrafts((prev) => ({
                          ...prev,
                          [dietKey]: {
                            ...prev[dietKey],
                            recipeId: value,
                            name: selectedRecipe?.name || "",
                          },
                        }));
                      }}
                      options={recipeOptions}
                      placeholder={t("menu.specialDishNamePlaceholder")}
                      searchPlaceholder={t("menu.specialDishSearchPlaceholder")}
                      emptyLabel={t("menu.noRecipeResults")}
                    />
                    <input
                      className="input"
                      placeholder={t("menu.specialDishNotePlaceholder")}
                      value={specialDietDrafts[dietKey].description}
                      onChange={(e) =>
                        setSpecialDietDrafts((prev) => ({
                          ...prev,
                          [dietKey]: {
                            ...prev[dietKey],
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setSpecialDietDrafts((prev) => ({
                          ...prev,
                          [dietKey]: {
                            recipeId: "",
                            name: "",
                            description: "",
                          },
                        }))
                      }
                    >
                      {t("common.remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setSpecialDietTarget(null)}>
                {t("common.cancel")}
              </button>
              <button className="btn-primary flex-1" onClick={saveSpecialDietMeals}>
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

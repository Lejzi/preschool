import type { FoodAllergyKey } from "@przedszkole/shared";

export const FOOD_ALLERGY_OPTIONS: FoodAllergyKey[] = [
  "gluten",
  "dairy",
  "egg",
  "nuts",
  "soy",
  "fish",
];

export function isPresetFoodAllergy(value: string): value is FoodAllergyKey {
  return FOOD_ALLERGY_OPTIONS.includes(value as FoodAllergyKey);
}


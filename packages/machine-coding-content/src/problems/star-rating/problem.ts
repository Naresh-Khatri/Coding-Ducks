import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Star Rating — base React/TS variant. Source files live beside this manifest
 * under `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const starRating: MachineCodingProblem = loadProblem({
  slug: "star-rating",
  title: "Star Rating",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Amazon", "Airbnb", "Booking.com"],
  templateId: "react-ts",
  displayOrder: 80,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Debounce — base TypeScript plus a plain-JS variant. Source files live beside
 * this manifest under `ts/` and `js/`; the loader reads them off disk (see
 * `../../loader.ts`).
 */
export const debounce: MachineCodingProblem = loadProblem({
  slug: "debounce",
  title: "Debounce",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 20,
  tags: ["Closures", "Timers"],
  companies: ["Google", "Meta", "Airbnb"],
  templateId: "vanilla-ts",
  displayOrder: 20,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

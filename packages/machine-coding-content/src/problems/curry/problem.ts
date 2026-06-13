import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Curry — base TypeScript plus a plain-JS variant. Source files live beside this
 * manifest under `ts/` and `js/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const curry: MachineCodingProblem = loadProblem({
  slug: "curry",
  title: "Curry",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Closures", "Recursion", "Functional"],
  companies: ["Meta", "Amazon", "Uber"],
  templateId: "vanilla-ts",
  displayOrder: 40,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

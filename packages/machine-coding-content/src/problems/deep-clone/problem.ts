import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Deep Clone — base TypeScript plus a plain-JS variant. Source files live beside
 * this manifest under `ts/` and `js/`; the loader reads them off disk (see
 * `../../loader.ts`).
 */
export const deepClone: MachineCodingProblem = loadProblem({
  slug: "deep-clone",
  title: "Deep Clone",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Recursion", "Objects"],
  companies: ["Google", "Amazon", "Microsoft"],
  templateId: "vanilla-ts",
  displayOrder: 50,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

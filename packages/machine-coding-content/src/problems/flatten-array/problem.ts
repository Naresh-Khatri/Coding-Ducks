import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Flatten Array — base TypeScript plus a plain JavaScript variant. Source files
 * live beside this manifest under `ts/` and `js/`; the loader reads them off
 * disk (see `../../loader.ts`).
 */
export const flattenArray: MachineCodingProblem = loadProblem({
  slug: "flatten-array",
  title: "Flatten Array",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 15,
  tags: ["Recursion", "Arrays"],
  companies: ["Meta", "Amazon"],
  templateId: "vanilla-ts",
  displayOrder: 10,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Throttle — base TypeScript plus a plain JavaScript variant. Source files
 * live beside this manifest under `ts/` and `js/`; the loader reads them off
 * disk (see `../../loader.ts`).
 */
export const throttle: MachineCodingProblem = loadProblem({
  slug: "throttle",
  title: "Throttle",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 20,
  tags: ["Closures", "Timers", "Rate limiting"],
  companies: ["Google", "Meta", "Stripe"],
  templateId: "vanilla-ts",
  displayOrder: 30,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

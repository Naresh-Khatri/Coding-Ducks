import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Promise Pool — base TypeScript plus a plain JavaScript variant. Source files
 * live beside this manifest under `ts/` and `js/`; the loader reads them off
 * disk (see `../../loader.ts`).
 */
export const promisePool: MachineCodingProblem = loadProblem({
  slug: "promise-pool",
  title: "Promise Pool",
  difficulty: "hard",
  category: "js-utility",
  durationMinutes: 45,
  tags: ["Promises", "Async", "Concurrency"],
  companies: ["Google", "Stripe", "Uber"],
  templateId: "vanilla-ts",
  displayOrder: 70,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

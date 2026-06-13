import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Event Emitter — base TypeScript plus a plain-JS variant. Source files live
 * beside this manifest under `ts/` and `js/`; the loader reads them off disk
 * (see `../../loader.ts`).
 */
export const eventEmitter: MachineCodingProblem = loadProblem({
  slug: "event-emitter",
  title: "Event Emitter",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Classes", "Pub/Sub"],
  companies: ["Meta", "Amazon", "Netflix"],
  templateId: "vanilla-ts",
  displayOrder: 60,
  variants: [{ id: "js", label: "JavaScript", templateId: "vanilla" }],
});

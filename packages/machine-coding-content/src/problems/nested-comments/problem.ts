import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Nested Comments — base React/TS variant. Source files live beside this manifest
 * under `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const nestedComments: MachineCodingProblem = loadProblem({
  slug: "nested-comments",
  title: "Nested Comments",
  difficulty: "hard",
  category: "ui-component",
  durationMinutes: 45,
  tags: ["React", "Recursion", "Trees"],
  companies: ["Reddit", "Meta", "Google"],
  templateId: "react-ts",
  displayOrder: 160,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

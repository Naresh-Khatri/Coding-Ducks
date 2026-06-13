import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Accordion — source files live beside this manifest under `react/`;
 * the loader reads them off disk (see `../../loader.ts`).
 */
export const accordion: MachineCodingProblem = loadProblem({
  slug: "accordion",
  title: "Accordion",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Microsoft", "Atlassian", "Google"],
  templateId: "react-ts",
  displayOrder: 90,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

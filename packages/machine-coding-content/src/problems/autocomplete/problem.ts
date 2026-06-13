import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Autocomplete — source files live beside this manifest under `react/`;
 * the loader reads them off disk (see `../../loader.ts`).
 */
export const autocomplete: MachineCodingProblem = loadProblem({
  slug: "autocomplete",
  title: "Autocomplete",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 35,
  tags: ["React", "State", "Lists"],
  companies: ["Google", "Meta", "LinkedIn"],
  templateId: "react-ts",
  displayOrder: 130,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

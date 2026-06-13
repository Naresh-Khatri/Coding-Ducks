import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Data Table — source files live beside this manifest under `react/`;
 * the loader reads them off disk (see `../../loader.ts`).
 */
export const dataTable: MachineCodingProblem = loadProblem({
  slug: "data-table",
  title: "Data Table",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 40,
  tags: ["React", "Sorting", "Pagination"],
  companies: ["Amazon", "Microsoft", "Atlassian"],
  templateId: "react-ts",
  displayOrder: 150,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

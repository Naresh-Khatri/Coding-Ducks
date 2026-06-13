import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Kanban Board — base React/TS variant. Source files live beside this manifest
 * under `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const kanbanBoard: MachineCodingProblem = loadProblem({
  slug: "kanban-board",
  title: "Kanban Board",
  difficulty: "hard",
  category: "ui-component",
  durationMinutes: 60,
  tags: ["React", "State", "Lists"],
  companies: ["Atlassian", "Linear", "Trello"],
  templateId: "react-ts",
  displayOrder: 180,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

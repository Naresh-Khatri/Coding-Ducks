import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Todo List — base React/TS plus Vue and Svelte framework variants. Source files
 * live beside this manifest under `react/`, `vue/`, and `svelte/`; the loader
 * reads them off disk (see `../../loader.ts`).
 */
export const todoList: MachineCodingProblem = loadProblem({
  slug: "todo-list",
  title: "Todo List",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "State", "Forms"],
  companies: ["Meta", "Microsoft"],
  templateId: "react-ts",
  displayOrder: 110,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

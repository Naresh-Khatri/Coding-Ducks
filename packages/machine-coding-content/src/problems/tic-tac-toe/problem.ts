import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Tic Tac Toe — base React/TS variant. Source files live beside this manifest
 * under `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const ticTacToe: MachineCodingProblem = loadProblem({
  slug: "tic-tac-toe",
  title: "Tic Tac Toe",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 45,
  tags: ["React", "State", "Game"],
  companies: ["Amazon", "Apple"],
  templateId: "react-ts",
  displayOrder: 170,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

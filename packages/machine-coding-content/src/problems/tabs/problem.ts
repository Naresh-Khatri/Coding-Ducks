import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Tabs — base React/TS variant. Source files live beside this manifest under
 * `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const tabs: MachineCodingProblem = loadProblem({
  slug: "tabs",
  title: "Tabs",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Meta", "Microsoft", "Shopify"],
  templateId: "react-ts",
  displayOrder: 100,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

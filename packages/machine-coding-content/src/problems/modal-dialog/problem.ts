import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Modal Dialog — base React/TS variant. Source files live beside this manifest
 * under `react/`; the loader reads them off disk (see `../../loader.ts`).
 */
export const modalDialog: MachineCodingProblem = loadProblem({
  slug: "modal-dialog",
  title: "Modal Dialog",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "Accessibility", "Events"],
  companies: ["Atlassian", "Stripe", "Airbnb"],
  templateId: "react-ts",
  displayOrder: 120,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

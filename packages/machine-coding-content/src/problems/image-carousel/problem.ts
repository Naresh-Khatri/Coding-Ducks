import type { MachineCodingProblem } from "../../types";
import { loadProblem } from "../../loader";

/**
 * Image Carousel — source files live beside this manifest under `react/`;
 * the loader reads them off disk (see `../../loader.ts`).
 */
export const imageCarousel: MachineCodingProblem = loadProblem({
  slug: "image-carousel",
  title: "Image Carousel",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "State", "Accessibility"],
  companies: ["Amazon", "Airbnb", "Netflix"],
  templateId: "react-ts",
  displayOrder: 140,
  variants: [
    { id: "vue", label: "Vue", templateId: "vue-ts" },
    { id: "svelte", label: "Svelte", templateId: "svelte-ts" },
  ],
});

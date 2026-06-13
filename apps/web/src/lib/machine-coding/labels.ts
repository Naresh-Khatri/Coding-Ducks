/** Shared display labels for practice categories and attempt statuses. */
export const CATEGORY_LABELS: Record<string, string> = {
  "ui-component": "UI",
  "js-utility": "JS Utils",
};

/**
 * Tech-stack logos shown next to each category label. SVGs live under
 * public/brand-icons (fetched via `npx @thesvg/cli add <slug>`). UI components
 * are React; utilities are plain JS/TS.
 */
export const CATEGORY_ICON_SRCS: Record<
  string,
  { src: string; alt: string }[]
> = {
  "ui-component": [{ src: "/brand-icons/react.svg", alt: "React" }],
  "js-utility": [
    { src: "/brand-icons/javascript.svg", alt: "JavaScript" },
    { src: "/brand-icons/typescript.svg", alt: "TypeScript" },
  ],
};

/**
 * Brand logo for a variant id — the language (ts/js) or framework (react/vue/
 * svelte) a problem can be solved in. Drives the icon in the workspace variant
 * selector. Unknown ids simply render without an icon.
 */
export const VARIANT_ICON_SRCS: Record<string, { src: string; alt: string }> = {
  ts: { src: "/brand-icons/typescript.svg", alt: "TypeScript" },
  js: { src: "/brand-icons/javascript.svg", alt: "JavaScript" },
  react: { src: "/brand-icons/react.svg", alt: "React" },
  vue: { src: "/brand-icons/vue.svg", alt: "Vue" },
  svelte: { src: "/brand-icons/svelte.svg", alt: "Svelte" },
};

export const STATUS_LABELS: Record<string, string> = {
  "in-progress": "In progress",
  completed: "Completed",
  revealed: "Solution viewed",
};

export const STATUS_DOT: Record<string, string> = {
  "in-progress": "bg-amber-500",
  completed: "bg-green-500",
  revealed: "bg-orange-500",
};

/** Shared display labels for practice categories and attempt statuses. */
export const CATEGORY_LABELS: Record<string, string> = {
  "ui-component": "UI",
  "js-utility": "JS Utils",
  "small-app": "App",
};

/**
 * Tech-stack logos shown next to each category label. SVGs live under
 * public/brand-icons (fetched via `npx @thesvg/cli add <slug>`). UI components
 * and small apps are React; utilities are plain JS/TS.
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
  "small-app": [{ src: "/brand-icons/react.svg", alt: "React" }],
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

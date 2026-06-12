/** Shared display labels for practice categories and attempt statuses. */
export const CATEGORY_LABELS: Record<string, string> = {
  "ui-component": "UI Component",
  "js-utility": "JS Utility",
  "small-app": "Small App",
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

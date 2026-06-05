/**
 * Mistral models offered in the Ask dock's model picker. Shared by the API
 * route (allow-list validation) and the dropdown — plain data, no server-only
 * imports. All work on Mistral's free tier; `-latest` aliases track the current
 * point release.
 */

export interface AskModel {
  /** Mistral model id sent to `/v1/chat/completions`. */
  id: string;
  /** Display name for the dropdown. */
  label: string;
}

export const ASK_MODELS: readonly AskModel[] = [
  { id: "codestral-latest", label: "Codestral" },
  { id: "devstral-medium-latest", label: "Devstral Medium" },
  { id: "mistral-small-latest", label: "Mistral Small" },
  { id: "mistral-medium-latest", label: "Mistral Medium" },
  { id: "mistral-large-latest", label: "Mistral Large" },
];

export const DEFAULT_ASK_MODEL = "codestral-latest";

/** Gate untrusted client input to the offered models. */
export function isAllowedAskModel(id: string): boolean {
  return ASK_MODELS.some((m) => m.id === id);
}

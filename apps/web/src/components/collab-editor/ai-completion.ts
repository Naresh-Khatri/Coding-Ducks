import type { Extension } from "@codemirror/state";

import type { InlineCompletionContext } from "./inline-completion";
import { inlineCompletion } from "./inline-completion";

/**
 * AI tab-completion (ghost text), accepted with Tab.
 *
 * Backed by Mistral Codestral's fill-in-the-middle endpoint, called through our
 * own `/api/ai/complete` route so the API key stays server-side and the request
 * is session-gated. The editor only ever talks to our own origin.
 *
 * To switch backends (e.g. self-hosted llama.cpp `/infill` on the RX570 box),
 * change the route implementation only — this file and the editor stay as-is.
 */
async function fetchCompletion(
  ctx: InlineCompletionContext,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: ctx.prefix, suffix: ctx.suffix }),
    signal,
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { completion?: string };
  return typeof data.completion === "string" ? data.completion : "";
}

export function aiCompletionExtension(): Extension {
  return inlineCompletion({ fetchFn: fetchCompletion, delay: 300 });
}

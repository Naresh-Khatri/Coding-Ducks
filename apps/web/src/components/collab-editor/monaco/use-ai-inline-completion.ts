"use client";

import { useEffect } from "react";
import type { Monaco } from "@monaco-editor/react";
import type {
  CancellationToken,
  editor as MEditor,
  languages,
  Position,
} from "monaco-editor";

/**
 * AI ghost-text completion via Monaco's first-class inline-completions API.
 *
 * Backed by the same `/api/ai/complete` route as before (Codestral FIM), so the
 * API key stays server-side. Monaco renders the dimmed suggestion and natively
 * arbitrates Tab-accept vs. the IntelliSense popup — no custom widget or
 * keymap-coordination shim needed.
 */
export function useAiInlineCompletion({
  monaco,
  enabled,
}: {
  monaco: Monaco | null;
  enabled: boolean;
}): void {
  useEffect(() => {
    if (!monaco || !enabled) return;

    const provider: languages.InlineCompletionsProvider = {
      async provideInlineCompletions(
        model: MEditor.ITextModel,
        position: Position,
        _context: languages.InlineCompletionContext,
        token: CancellationToken,
      ): Promise<languages.InlineCompletions> {
        const offset = model.getOffsetAt(position);
        const text = model.getValue();
        const controller = new AbortController();
        token.onCancellationRequested(() => controller.abort());

        try {
          const res = await fetch("/api/ai/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prefix: text.slice(0, offset),
              suffix: text.slice(offset),
            }),
            signal: controller.signal,
          });
          if (!res.ok) return { items: [] };
          const data = (await res.json()) as { completion?: string };
          const completion =
            typeof data.completion === "string" ? data.completion : "";
          if (!completion.trim()) return { items: [] };
          return {
            items: [
              {
                insertText: completion,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column,
                ),
              },
            ],
          };
        } catch {
          return { items: [] };
        }
      },
      freeInlineCompletions() {
        // Nothing to release — items are plain objects.
      },
    };

    const disposable = monaco.languages.registerInlineCompletionsProvider(
      ["typescript", "javascript", "css", "html", "json", "markdown"],
      provider,
    );
    return () => disposable.dispose();
  }, [monaco, enabled]);
}

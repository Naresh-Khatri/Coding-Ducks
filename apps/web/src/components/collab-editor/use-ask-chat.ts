"use client";

import type * as Y from "yjs";
import { useCallback, useState } from "react";

import { readAllFiles } from "@acme/ducklet-fs";

import { DEFAULT_ASK_MODEL } from "~/lib/ai/models";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Changed file paths (assistant turns only) — rendered as clickable chips. */
  files?: string[];
  /** Marks an assistant turn that is a transport/parse error, not a real reply. */
  isError?: boolean;
  /** A local-only status note (e.g. reinstalling deps); not sent upstream. */
  isSystem?: boolean;
}

export interface AskProposal {
  path: string;
  /** New file contents for a write; absent for a delete. */
  content?: string;
  /** When true, the proposal removes the file. */
  delete?: boolean;
}

export interface AskChat {
  messages: ChatMessage[];
  model: string;
  setModel: (model: string) => void;
  loading: boolean;
  send: (text: string) => Promise<void>;
  /** Append a local-only status note to the transcript (not sent upstream). */
  notify: (text: string) => void;
  clear: () => void;
}

const newId = () => globalThis.crypto.randomUUID();

/**
 * Multi-turn conversation state for the Ask panel. Lives at the workspace level
 * (not inside the panel) so the transcript survives closing/reopening the
 * panel. Each reply's file edits are handed to `onProposal`, which registers
 * them as pending diffs in the editor — this hook never writes to the Y.Doc.
 */
export function useAskChat({
  ydoc,
  onProposal,
}: {
  ydoc: Y.Doc;
  onProposal: (edits: AskProposal[]) => void;
}): AskChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_ASK_MODEL);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
      };
      // Snapshot the transcript we're sending so the request matches the UI.
      const history = [...messages, userMsg];
      setMessages(history);
      setLoading(true);

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // System notes are local UI only — never sent to the model.
            messages: history
              .filter((m) => !m.isSystem)
              .map((m) => ({ role: m.role, content: m.content })),
            files: readAllFiles(ydoc),
            model,
          }),
        });
        const data = (await res.json()) as {
          explanation?: string;
          edits?: AskProposal[];
          error?: string;
        };

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: data.error ?? `Request failed (${res.status})`,
              isError: true,
            },
          ]);
          return;
        }

        const edits = data.edits ?? [];
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: data.explanation?.trim() ?? "",
            files: edits.map((e) => e.path),
          },
        ]);
        if (edits.length > 0) onProposal(edits);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: "Could not reach the AI service.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, model, ydoc, onProposal],
  );

  const notify = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "assistant", content: text, isSystem: true },
    ]);
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  return { messages, model, setModel, loading, send, notify, clear };
}

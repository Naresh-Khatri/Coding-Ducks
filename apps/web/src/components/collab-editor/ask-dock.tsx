"use client";

import type { Components } from "react-markdown";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Eraser,
  FileDiff,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { basename } from "@acme/ducklet-fs";

import type { AskChat } from "./use-ask-chat";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ASK_MODELS } from "~/lib/ai/models";
import { cn } from "~/lib/utils";
import { FileIcon } from "./file-icon";

const MD: Components = {
  p: (props) => (
    <p className="mb-1.5 text-sm leading-relaxed last:mb-0" {...props} />
  ),
  ul: (props) => (
    <ul className="mb-1.5 ml-4 list-disc space-y-0.5 text-sm" {...props} />
  ),
  ol: (props) => (
    <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 text-sm" {...props} />
  ),
  code: ({ children, ...props }) => (
    <code
      className="bg-background/60 rounded px-1 py-0.5 font-mono text-xs"
      {...props}
    >
      {children}
    </code>
  ),
};

/**
 * A floating chat bar overlaid at the bottom of the editor pane (à la
 * ChatGPT/Claude): collapsed it's just an input; focusing it expands upward to
 * reveal the transcript, and blurring collapses it again. Replies are short —
 * proposed code changes surface as diffs in the editor (via the workspace's
 * pending state), and each turn lists changed files as chips that open them.
 * Conversation state lives in `chat` (a workspace hook) so it persists.
 */
export function AskDock({
  chat,
  pendingPaths,
  onOpenFile,
}: {
  chat: AskChat;
  pendingPaths: Set<string>;
  onOpenFile: (path: string) => void;
}) {
  const { messages, model, setModel, loading, send, clear } = chat;
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  // The model dropdown portals out of this subtree, so track it explicitly to
  // avoid collapsing while it's open.
  const [selectOpen, setSelectOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const expanded = focused || loading || selectOpen;
  const showThread = expanded && (messages.length > 0 || loading);

  // Follow the tail while expanded.
  useEffect(() => {
    if (!showThread) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, showThread]);

  const submit = () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    void send(text);
  };

  return (
    <div
      // Anchored to the bottom; growing the thread pushes the top edge up.
      className={cn(
        "absolute inset-x-0 bottom-8 z-20 mx-auto w-[min(25rem,92%)] transition-all duration-400",
        focused && "z-30 w-[min(40rem,92%)]",
      )}
      onFocusCapture={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border shadow-lg transition-colors",
          expanded ? "bg-[#1e1e1e]" : "bg-[#1e1e1e]/85 backdrop-blur-sm",
        )}
      >
        {/* Header + transcript — collapses to zero height when not expanded. */}
        <div
          className={cn(
            "flex flex-col overflow-hidden transition-all duration-200",
            expanded ? "max-h-[min(55vh,26rem)]" : "max-h-0",
          )}
        >
          <div className="bg-muted/20 flex items-center gap-2 border-b px-3 py-1.5">
            <Sparkles className="text-primary size-3.5" />
            <span className="text-xs font-medium">Ask AI</span>
            <Select
              value={model}
              onValueChange={setModel}
              open={selectOpen}
              onOpenChange={setSelectOpen}
            >
              <SelectTrigger className="ml-auto h-6 w-32 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASK_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={clear}
                title="Clear conversation"
              >
                <Eraser className="size-3.5" />
              </Button>
            )}
          </div>

          {showThread && (
            <div
              ref={scrollRef}
              className="max-h-[min(44vh,20rem)] space-y-3 overflow-y-auto p-3"
            >
              {messages.map((m) =>
                m.isSystem ? (
                  <div
                    key={m.id}
                    className="text-muted-foreground/80 flex items-center justify-center gap-1.5 px-2 text-center text-xs italic"
                  >
                    <Package className="size-3 shrink-0" />
                    {m.content}
                  </div>
                ) : m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-muted/50 max-w-[85%] rounded-lg rounded-br-sm px-3 py-1.5 text-sm whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex flex-col gap-1.5">
                    <div
                      className={cn(
                        "text-foreground/90",
                        m.isError && "text-destructive",
                      )}
                    >
                      {m.content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MD}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground text-sm italic">
                          (no changes)
                        </p>
                      )}
                    </div>
                    {m.files && m.files.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.files.map((path) => {
                          const isPending = pendingPaths.has(path);
                          return (
                            <button
                              key={path}
                              type="button"
                              onClick={() => onOpenFile(path)}
                              title={
                                isPending
                                  ? `Review diff: ${path}`
                                  : `${path} (reviewed)`
                              }
                              className={cn(
                                "flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs",
                                isPending
                                  ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20"
                                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
                              )}
                            >
                              <FileIcon name={basename(path)} />
                              <span className="truncate font-mono">{path}</span>
                              {isPending ? (
                                <FileDiff className="size-3 shrink-0 text-amber-400" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ),
              )}

              {loading && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input row — always visible. */}
        <div className="flex items-end gap-1.5 p-1.5 transition-all duration-200">
          {/* Collapsed-only cue that AI changes are awaiting review; expands the
              dock so the file chips are reachable. */}
          {!expanded && pendingPaths.size > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              title={`${pendingPaths.size} change${
                pendingPaths.size === 1 ? "" : "s"
              } awaiting review`}
              className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
            >
              <FileDiff className="size-3" />
              {pendingPaths.size}
            </button>
          )}
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                inputRef.current?.blur();
              }
            }}
            placeholder="Ask anything, or request a change…"
            className={cn(
              "flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1 text-sm transition-[height] duration-200 outline-none",
              expanded ? "h-[4.5rem]" : "h-7",
            )}
          />
          <Button
            size="icon"
            className="size-7 shrink-0 rounded-md"
            onClick={submit}
            disabled={loading || draft.trim() === ""}
            title="Send (Enter)"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUp className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

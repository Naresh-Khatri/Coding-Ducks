"use client";

import { useState } from "react";
import { ChevronRight, Code2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { authClient } from "~/auth/client";
import { getLanguageLabel } from "~/lib/languages";
import { useTRPC } from "~/trpc/react";
import type { ProblemDetail } from "../types";
import { markdownComponents } from "./markdown-components";

interface SolutionsPanelProps {
  problem: ProblemDetail;
  isAuthenticated: boolean;
}

export function SolutionsPanel({
  problem,
  isAuthenticated,
}: SolutionsPanelProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const solutionsQuery = useQuery(
    trpc.solution.list.queryOptions({ problemId: problem.id }),
  );

  const best = problem.bestSubmission;
  const canShare = best?.status === "accepted";

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const createSolution = useMutation(
    trpc.solution.create.mutationOptions({
      onSuccess: () => {
        setComposing(false);
        setTitle("");
        setBody("");
        void solutionsQuery.refetch();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const deleteSolution = useMutation(
    trpc.solution.delete.mutationOptions({
      onSuccess: () => void solutionsQuery.refetch(),
    }),
  );

  const solutions = solutionsQuery.data ?? [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-6 pb-32">
      {isAuthenticated && canShare && !composing && (
        <Button
          size="sm"
          onClick={() => setComposing(true)}
          className="mb-6 h-8 text-xs"
        >
          Share your solution
        </Button>
      )}
      {isAuthenticated && !canShare && (
        <p className="text-muted-foreground mb-6 text-xs">
          Solve this problem to share your solution.
        </p>
      )}
      {!isAuthenticated && (
        <p className="text-muted-foreground mb-6 text-xs">
          Sign in and solve this problem to share a solution.
        </p>
      )}

      {composing && best && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t) return;
            createSolution.mutate({
              problemId: problem.id,
              title: t,
              body: body.trim() || undefined,
              code: best.code,
              lang: best.lang,
            });
          }}
          className="mb-8 space-y-3"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. O(n) sliding window)"
            maxLength={200}
            className="text-sm"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Explain your approach (Markdown, optional)…"
            maxLength={20000}
            className="min-h-24 resize-none text-sm"
          />
          <div className="text-muted-foreground text-[11px]">
            Publishing your accepted {getLanguageLabel(best.lang)} submission.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setComposing(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || createSolution.isPending}
              className="h-8 text-xs"
            >
              {createSolution.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      )}

      {solutions.length > 0 ? (
        <ul className="space-y-6">
          {solutions.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-white/5 bg-accent/20 p-4"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={s.userImage ?? undefined} alt="" />
                  <AvatarFallback className="text-[10px]">
                    {s.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground text-xs font-semibold">
                  {s.userName}
                </span>
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                  {getLanguageLabel(s.lang)}
                </span>
                <span className="text-muted-foreground/60 text-[10px]">
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {s.userId === currentUserId && (
                  <button
                    onClick={() => deleteSolution.mutate({ id: s.id })}
                    disabled={deleteSolution.isPending}
                    aria-label="Delete solution"
                    className="text-muted-foreground/50 hover:text-rose-500 ml-auto transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              <h3 className="text-foreground mt-3 text-sm font-semibold">
                {s.title}
              </h3>

              {s.body && (
                <div className="prose prose-invert prose-slate mt-2 max-w-none text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {s.body}
                  </ReactMarkdown>
                </div>
              )}

              <button
                onClick={() =>
                  setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))
                }
                aria-expanded={!!expanded[s.id]}
                className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Code2 className="h-3.5 w-3.5" />
                {expanded[s.id] ? "Hide" : "View"} code
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${
                    expanded[s.id] ? "rotate-90" : ""
                  }`}
                />
              </button>
              {expanded[s.id] && (
                <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-white/5 bg-[#1e1e1e]">
                  <CodeEditor
                    value={s.code}
                    onChange={() => {}}
                    language={s.lang as Language}
                    height="320px"
                    readOnly
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
          <Code2 className="text-muted-foreground mb-4 h-8 w-8" />
          <p className="text-muted-foreground text-xs font-medium">
            No solutions shared yet
          </p>
        </div>
      )}
    </div>
  );
}

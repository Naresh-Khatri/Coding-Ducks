"use client";

import { useState } from "react";
import { ChevronRight, Code2, MessageSquare, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  RichTextContent,
  RichTextEditor,
} from "~/components/rich-text-editor";
import { authClient } from "~/auth/client";
import { getLanguageLabel } from "~/lib/languages";
import { useTRPC } from "~/trpc/react";
import type { ProblemDetail } from "../types";

interface DiscussionPanelProps {
  problem: ProblemDetail;
  isAuthenticated: boolean;
}

function timeAgo(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiscussionPanel({
  problem,
  isAuthenticated,
}: DiscussionPanelProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const commentsQuery = useQuery(
    trpc.comment.list.queryOptions({ problemId: problem.id }),
  );

  const best = problem.bestSubmission;
  const canShare = best?.status === "accepted";

  const [body, setBody] = useState("");
  const [attach, setAttach] = useState(false);
  const [title, setTitle] = useState("");
  const [replyBody, setReplyBody] = useState<Record<number, string>>({});
  const [openReply, setOpenReply] = useState<Record<number, boolean>>({});
  const [openCode, setOpenCode] = useState<Record<number, boolean>>({});

  const createComment = useMutation(
    trpc.comment.create.mutationOptions({
      onSuccess: () => void commentsQuery.refetch(),
      onError: (e) => toast.error(e.message),
    }),
  );

  const deleteComment = useMutation(
    trpc.comment.delete.mutationOptions({
      onSuccess: () => void commentsQuery.refetch(),
    }),
  );

  const comments = commentsQuery.data ?? [];

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const sharing = attach && canShare && best;
    await createComment.mutateAsync({
      problemId: problem.id,
      body: text,
      ...(sharing
        ? {
            title: title.trim() || undefined,
            code: best.code,
            lang: best.lang,
          }
        : {}),
    });
    setBody("");
    setTitle("");
    setAttach(false);
  }

  async function submitReply(parentId: number) {
    const text = (replyBody[parentId] ?? "").trim();
    if (!text) return;
    await createComment.mutateAsync({
      problemId: problem.id,
      body: text,
      parentId,
    });
    setReplyBody((p) => ({ ...p, [parentId]: "" }));
    setOpenReply((p) => ({ ...p, [parentId]: false }));
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-6 pb-32">
      {isAuthenticated ? (
        <form onSubmit={submitPost} className="mb-8">
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Share your approach or ask a question…"
          />
          {attach && canShare && best && (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Solution title (optional, e.g. O(n) sliding window)"
              maxLength={200}
              className="mt-2 text-sm"
            />
          )}
          <div className="mt-2 flex items-center justify-between">
            {canShare ? (
              <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={attach}
                  onChange={(e) => setAttach(e.target.checked)}
                  className="accent-primary h-3 w-3"
                />
                Attach my accepted{" "}
                {best ? getLanguageLabel(best.lang) : ""} solution
              </label>
            ) : (
              <span className="text-muted-foreground/60 text-[11px]">
                Solve this problem to attach your solution.
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || createComment.isPending}
              className="h-8 text-xs"
            >
              {createComment.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground mb-6 text-xs">
          Sign in to join the discussion.
        </p>
      )}

      {comments.length > 0 ? (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-white/5 bg-accent/20 p-4"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={c.userImage ?? undefined} alt="" />
                  <AvatarFallback className="text-[10px]">
                    {c.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground text-xs font-semibold">
                  {c.userName}
                </span>
                {c.code && c.lang && (
                  <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    {getLanguageLabel(c.lang)}
                  </span>
                )}
                <span className="text-muted-foreground/60 text-[10px]">
                  {timeAgo(c.createdAt)}
                </span>
                {c.userId === currentUserId && (
                  <button
                    onClick={() => deleteComment.mutate({ id: c.id })}
                    disabled={deleteComment.isPending}
                    aria-label="Delete post"
                    className="text-muted-foreground/50 hover:text-rose-500 ml-auto transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {c.title && (
                <h3 className="text-foreground mt-3 text-sm font-semibold">
                  {c.title}
                </h3>
              )}
              <div className="mt-2">
                <RichTextContent html={c.body} />
              </div>

              {c.code && c.lang && (
                <>
                  <button
                    onClick={() =>
                      setOpenCode((p) => ({ ...p, [c.id]: !p[c.id] }))
                    }
                    aria-expanded={!!openCode[c.id]}
                    className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    {openCode[c.id] ? "Hide" : "View"} code
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        openCode[c.id] ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {openCode[c.id] && (
                    <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-white/5 bg-[#1e1e1e]">
                      <CodeEditor
                        value={c.code}
                        onChange={() => {}}
                        language={c.lang as Language}
                        height="320px"
                        readOnly
                      />
                    </div>
                  )}
                </>
              )}

              {/* Replies */}
              {c.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l border-white/5 pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id} className="flex gap-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={r.userImage ?? undefined} alt="" />
                        <AvatarFallback className="text-[8px]">
                          {r.userName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-[11px] font-semibold">
                            {r.userName}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">
                            {timeAgo(r.createdAt)}
                          </span>
                          {r.userId === currentUserId && (
                            <button
                              onClick={() =>
                                deleteComment.mutate({ id: r.id })
                              }
                              disabled={deleteComment.isPending}
                              aria-label="Delete reply"
                              className="text-muted-foreground/50 hover:text-rose-500 ml-auto transition-colors"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <RichTextContent html={r.body} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {isAuthenticated &&
                (openReply[c.id] ? (
                  <div className="mt-3">
                    <RichTextEditor
                      value={replyBody[c.id] ?? ""}
                      onChange={(html) =>
                        setReplyBody((p) => ({ ...p, [c.id]: html }))
                      }
                      placeholder="Write a reply…"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenReply((p) => ({ ...p, [c.id]: false }))
                        }
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void submitReply(c.id)}
                        disabled={
                          !(replyBody[c.id] ?? "").trim() ||
                          createComment.isPending
                        }
                        className="h-7 text-xs"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setOpenReply((p) => ({ ...p, [c.id]: true }))
                    }
                    className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reply
                  </button>
                ))}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
          <MessageSquare className="text-muted-foreground mb-4 h-8 w-8" />
          <p className="text-muted-foreground text-xs font-medium">
            No discussion yet
          </p>
        </div>
      )}
    </div>
  );
}

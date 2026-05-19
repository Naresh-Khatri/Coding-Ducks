"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  RichTextContent,
  RichTextEditor,
} from "~/components/rich-text-editor";
import { ShikiCode } from "~/components/shiki-code";
import { authClient } from "~/auth/client";
import { getLanguageLabel } from "~/lib/languages";
import { useTRPC } from "~/trpc/react";
import type { ProblemDetail } from "../types";

type Comment = NonNullable<
  ReturnType<typeof useDiscussion>["comments"]
>[number];

interface DiscussionPanelProps {
  problem: ProblemDetail;
  isAuthenticated: boolean;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function useDiscussion(problemId: number) {
  const trpc = useTRPC();
  const commentsQuery = useQuery(
    trpc.comment.list.queryOptions({ problemId }),
  );
  return { commentsQuery, comments: commentsQuery.data };
}

export function DiscussionPanel({
  problem,
  isAuthenticated,
}: DiscussionPanelProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const { commentsQuery } = useDiscussion(problem.id);

  const best = problem.bestSubmission;
  const canShare = best?.status === "accepted";

  const [openId, setOpenId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attach, setAttach] = useState(false);
  const [replyBody, setReplyBody] = useState("");

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
  const openPost = comments.find((c) => c.id === openId) ?? null;

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const text = body.trim();
    if (!t || !text) return;
    const sharing = attach && canShare && best;
    await createComment.mutateAsync({
      problemId: problem.id,
      title: t,
      body: text,
      ...(sharing ? { code: best.code, lang: best.lang } : {}),
    });
    setTitle("");
    setBody("");
    setAttach(false);
  }

  async function submitReply(parentId: number) {
    const text = replyBody.trim();
    if (!text) return;
    await createComment.mutateAsync({
      problemId: problem.id,
      body: text,
      parentId,
    });
    setReplyBody("");
  }

  // ---- Detail view -------------------------------------------------------
  if (openPost) {
    const c = openPost;
    return (
      <div className="custom-scrollbar h-full overflow-y-auto p-6 pb-32">
        <button
          onClick={() => setOpenId(null)}
          className="text-muted-foreground hover:text-foreground mb-5 flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to discussion
        </button>

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
            {fmtDate(c.createdAt)}
          </span>
          {c.userId === currentUserId && (
            <button
              onClick={() =>
                deleteComment.mutate(
                  { id: c.id },
                  { onSuccess: () => setOpenId(null) },
                )
              }
              disabled={deleteComment.isPending}
              aria-label="Delete post"
              className="text-muted-foreground/50 hover:text-rose-500 ml-auto transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <h2 className="text-foreground mt-4 text-lg font-bold tracking-tight">
          {c.title}
        </h2>

        <div className="mt-3">
          <RichTextContent html={c.body} />
        </div>

        {c.code && c.lang && (
          <div className="bg-accent/20 mt-4 overflow-x-auto rounded-lg border border-white/5 p-4">
            <ShikiCode code={c.code} lang={c.lang} />
          </div>
        )}

        {/* Replies */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase">
            {c.replies.length} {c.replies.length === 1 ? "Reply" : "Replies"}
          </h3>

          {c.replies.length > 0 && (
            <ul className="mb-6 space-y-4">
              {c.replies.map((r) => (
                <li key={r.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={r.userImage ?? undefined} alt="" />
                    <AvatarFallback className="text-[9px]">
                      {r.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-[11px] font-semibold">
                        {r.userName}
                      </span>
                      <span className="text-muted-foreground/60 text-[10px]">
                        {fmtDate(r.createdAt)}
                      </span>
                      {r.userId === currentUserId && (
                        <button
                          onClick={() => deleteComment.mutate({ id: r.id })}
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

          {isAuthenticated ? (
            <div>
              <RichTextEditor
                value={replyBody}
                onChange={setReplyBody}
                placeholder="Write a reply…"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submitReply(c.id)}
                  disabled={!replyBody.trim() || createComment.isPending}
                  className="h-8 text-xs"
                >
                  {createComment.isPending ? "Replying…" : "Reply"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Sign in to reply.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- List view ---------------------------------------------------------
  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-6 pb-32">
      {isAuthenticated ? (
        <form onSubmit={submitPost} className="mb-8 space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. O(n) sliding window — Python)"
            maxLength={200}
            className="text-sm font-medium"
          />
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Share your approach or ask a question…"
            footer={
              attach && canShare && best ? (
                <>
                  <div className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                    Attached {getLanguageLabel(best.lang)} solution
                  </div>
                  <ShikiCode code={best.code} lang={best.lang} />
                </>
              ) : undefined
            }
          />
          <div className="flex items-center justify-between">
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
              disabled={
                !title.trim() || !body.trim() || createComment.isPending
              }
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
        <ul className="divide-y divide-white/5">
          {comments.map((c) => (
            <ListRow
              key={c.id}
              comment={c}
              onOpen={() => setOpenId(c.id)}
            />
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

function ListRow({
  comment: c,
  onOpen,
}: {
  comment: Comment;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="flex w-full items-start gap-3 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={c.userImage ?? undefined} alt="" />
          <AvatarFallback className="text-[10px]">
            {c.userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <span className="text-foreground/80 font-medium">
              {c.userName}
            </span>
            <span>·</span>
            <span>{fmtDate(c.createdAt)}</span>
          </div>
          <p className="text-foreground mt-1 truncate text-sm font-semibold">
            {c.title}
          </p>
          <div className="text-muted-foreground/70 mt-2 flex items-center gap-4 text-[11px]">
            {c.code && c.lang && (
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">
                {getLanguageLabel(c.lang)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {c.replies.length}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

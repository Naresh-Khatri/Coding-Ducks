"use client";

import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

interface DiscussionPanelProps {
  problemId: number;
  isAuthenticated: boolean;
}

export function DiscussionPanel({
  problemId,
  isAuthenticated,
}: DiscussionPanelProps) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const commentsQuery = useQuery(
    trpc.comment.list.queryOptions({ problemId }),
  );

  const [body, setBody] = useState("");

  const createComment = useMutation(
    trpc.comment.create.mutationOptions({
      onSuccess: () => {
        setBody("");
        void commentsQuery.refetch();
      },
    }),
  );

  const deleteComment = useMutation(
    trpc.comment.delete.mutationOptions({
      onSuccess: () => void commentsQuery.refetch(),
    }),
  );

  const comments = commentsQuery.data ?? [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-6 pb-32">
      {isAuthenticated ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = body.trim();
            if (trimmed) createComment.mutate({ problemId, body: trimmed });
          }}
          className="mb-6"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your approach or ask a question…"
            maxLength={2000}
            className="min-h-20 resize-none text-sm"
          />
          <div className="mt-2 flex justify-end">
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
        <ul className="space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={c.userImage ?? undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {c.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-xs font-semibold">
                    {c.userName}
                  </span>
                  <span className="text-muted-foreground/60 text-[10px]">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {c.userId === currentUserId && (
                    <button
                      onClick={() => deleteComment.mutate({ id: c.id })}
                      disabled={deleteComment.isPending}
                      aria-label="Delete comment"
                      className="text-muted-foreground/50 hover:text-rose-500 ml-auto transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-foreground/90 mt-1 text-sm whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
          <MessageSquare className="text-muted-foreground mb-4 h-8 w-8" />
          <p className="text-muted-foreground text-xs font-medium">
            No comments yet
          </p>
        </div>
      )}
    </div>
  );
}

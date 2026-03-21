"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

interface BookmarkButtonProps {
  problemId: number;
  initialBookmarked?: boolean;
}

export function BookmarkButton({
  problemId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data } = useQuery(
    trpc.bookmark.isBookmarked.queryOptions(
      { problemId },
      {
        enabled: !!session,
        initialData: initialBookmarked != null
          ? { bookmarked: initialBookmarked }
          : undefined,
      },
    ),
  );

  const toggleMutation = useMutation(
    trpc.bookmark.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["bookmark"]] });
      },
    }),
  );

  if (!session) return null;

  const isBookmarked = data?.bookmarked ?? false;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMutation.mutate({ problemId });
      }}
      disabled={toggleMutation.isPending}
    >
      <Bookmark
        className={cn(
          "h-4 w-4 transition-colors",
          isBookmarked
            ? "fill-primary text-primary"
            : "text-muted-foreground",
        )}
      />
    </Button>
  );
}

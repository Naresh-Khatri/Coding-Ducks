"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Bookmark, CheckCircle, Circle, Loader2, Search } from "lucide-react";
import { cn } from "~/lib/utils";
import { BookmarkButton } from "~/components/bookmark-button";
import { authClient } from "~/auth/client";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ProblemsPage() {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const [tab, setTab] = useState<"all" | "bookmarks">("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string | undefined>();

  const { data, isLoading } = useQuery(
    trpc.problem.list.queryOptions({
      search: search || undefined,
      difficulty: difficulty === "all" ? undefined : (difficulty as "easy" | "medium" | "hard" | undefined),
      limit: 50,
    })
  );

  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery(
    trpc.bookmark.list.queryOptions(
      { limit: 50 },
      { enabled: tab === "bookmarks" && !!session },
    ),
  );

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Problems</h1>
        <p className="text-muted-foreground">
          Practice coding problems and improve your skills
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b mb-6">
        <button
          onClick={() => setTab("all")}
          className={cn(
            "pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          All Problems
        </button>
        {session && (
          <button
            onClick={() => setTab("bookmarks")}
            className={cn(
              "pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
              tab === "bookmarks"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Bookmarks
          </button>
        )}
      </div>

      {tab === "all" ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Problems Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground bg-muted/30">
              <div className="w-8 flex justify-center">Status</div>
              <div>Title</div>
              <div className="w-24 text-center">Difficulty</div>
              <div className="w-20 text-center">Solved</div>
              <div className="w-10"></div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No problems found
              </div>
            ) : (
              <div className="divide-y">
                {data?.items.map((problem, index) => (
                  <div
                    key={problem.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors items-center group"
                  >
                    <div className="w-8 flex justify-center">
                      {problem.userStatus === "solved" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : problem.userStatus === "attempted" ? (
                        <Circle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                      )}
                    </div>
                    <Link href={`/problems/${problem.slug}`} className="font-medium">
                      <span className="text-muted-foreground/50 mr-3 font-mono text-sm">
                        {index + 1}.
                      </span>
                      {problem.title}
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="inline-flex ml-3 gap-1">
                          {problem.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                    <div className="w-24 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize font-normal",
                          DIFFICULTY_COLORS[problem.difficulty]
                        )}
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <div className="w-20 text-center text-sm text-muted-foreground">
                      {problem.acceptanceRate != null ? `${problem.acceptanceRate}%` : "-"}
                    </div>
                    <div className="w-10 flex justify-center">
                      <BookmarkButton problemId={problem.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Bookmarks Tab */
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground bg-muted/30">
            <div>Title</div>
            <div className="w-24 text-center">Difficulty</div>
            <div className="w-32 text-center">Saved</div>
            <div className="w-10"></div>
          </div>

          {bookmarksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !bookmarks || bookmarks.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <Bookmark className="h-10 w-10" />
              <p className="text-sm">No bookmarked problems yet</p>
              <p className="text-xs">Click the bookmark icon on any problem to save it here</p>
            </div>
          ) : (
            <div className="divide-y">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors items-center"
                >
                  <Link
                    href={`/problems/${bm.problemSlug}`}
                    className="font-medium hover:underline"
                  >
                    {bm.problemTitle}
                    {bm.problemTags && bm.problemTags.length > 0 && (
                      <span className="ml-3 inline-flex gap-1">
                        {bm.problemTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </Link>
                  <div className="w-24 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize font-normal",
                        DIFFICULTY_COLORS[bm.problemDifficulty],
                      )}
                    >
                      {bm.problemDifficulty}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground w-32 text-center text-sm">
                    {new Date(bm.createdAt).toLocaleDateString()}
                  </div>
                  <div className="w-10 flex justify-center">
                    <BookmarkButton problemId={bm.problemId} initialBookmarked />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

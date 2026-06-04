"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  Play,
  Send,
  Shuffle,
  Timer,
} from "lucide-react";

import { authClient } from "~/auth/client";
import { AnimatedThemeToggler } from "~/components/ui/animated-theme-toggler";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSignIn } from "~/components/sign-in-dialog";
import { getAvatarUrl } from "~/lib/avatar";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

interface ProblemHeaderProps {
  isRunning: boolean;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  onRun: () => void;
  onSubmit: () => void;
}

export function ProblemHeader({
  isRunning,
  isSubmitting,
  isAuthenticated,
  onRun,
  onSubmit,
}: ProblemHeaderProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { openSignIn } = useSignIn();

  // Execution timer
  const isBusy = isRunning || isSubmitting;
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  // setElapsed(0) resets the stopwatch then the interval fires repeatedly; these
  // are not cascading state updates — they are a timer driving a single counter.
  // react-doctor-disable-next-line react-doctor/no-cascading-set-state
  useEffect(() => {
    if (isBusy) {
      startRef.current = Date.now();
      // Reset the on-screen stopwatch to 0 as a new run starts; this is a
      // timer side effect, not state mirrored from a prop.
      // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
      setElapsed(0);
      const id = setInterval(
        () => setElapsed(Date.now() - startRef.current),
        100,
      );
      return () => clearInterval(id);
    }
  }, [isBusy]);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/") },
    });
  };

  const { data: problemsList } = useQuery(
    trpc.problem.list.queryOptions({ limit: 50 }),
  );

  // Prev/next/random over the first page of problems (limit 50).
  const items = problemsList?.items ?? [];
  const currentIndex = items.findIndex((p) => p.slug === slug);
  const prevSlug = currentIndex > 0 ? items[currentIndex - 1]?.slug : undefined;
  const nextSlug =
    currentIndex >= 0 && currentIndex < items.length - 1
      ? items[currentIndex + 1]?.slug
      : undefined;

  const goRandom = () => {
    const others = items.filter((p) => p.slug !== slug);
    if (others.length === 0) return;
    const pick = others[Math.floor(Math.random() * others.length)];
    if (pick) router.push(`/problems/${pick.slug}`);
  };

  return (
    <div className="bg-background flex h-12 shrink-0 items-center justify-between border-b px-3">
      {/* Left: back + problems list */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild className="size-8">
          <Link href="/problems" aria-label="Back to problems">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open problems list"
              className="size-8"
            >
              <List className="size-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-80">
            <DrawerHeader>
              <DrawerTitle>Problems</DrawerTitle>
            </DrawerHeader>
            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1">
                {problemsList?.items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/problems/${p.slug}`}
                    className="hover:bg-accent flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    <span className="truncate">{p.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2 shrink-0 border-none px-1.5 py-0 text-[9px] font-bold capitalize",
                        p.difficulty === "easy" &&
                          "bg-emerald-500/10 text-emerald-500",
                        p.difficulty === "medium" &&
                          "bg-amber-500/10 text-amber-500",
                        p.difficulty === "hard" &&
                          "bg-rose-500/10 text-rose-500",
                      )}
                    >
                      {p.difficulty}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <div className="bg-border/50 mx-1 h-5 w-px" />

        <Button
          variant="ghost"
          size="icon"
          asChild={!!prevSlug}
          disabled={!prevSlug}
          aria-label="Previous problem"
          className="size-8"
        >
          {prevSlug ? (
            <Link href={`/problems/${prevSlug}`}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          asChild={!!nextSlug}
          disabled={!nextSlug}
          aria-label="Next problem"
          className="size-8"
        >
          {nextSlug ? (
            <Link href={`/problems/${nextSlug}`}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goRandom}
          disabled={items.length <= 1}
          aria-label="Random problem"
          className="size-8"
        >
          <Shuffle className="size-4" />
        </Button>
      </div>

      {/* Center: run + submit */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={isRunning || isSubmitting}
          className="h-8 gap-1.5 px-4 text-xs font-medium"
        >
          {isRunning ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Run
          <kbd className="text-muted-foreground/50 ml-1 hidden text-[10px] sm:inline">
            Ctrl+↵
          </kbd>
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!isAuthenticated || isRunning || isSubmitting}
          className="h-8 gap-1.5 bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500"
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Submit
          <kbd className="ml-1 hidden text-[10px] text-white/40 sm:inline">
            Ctrl+⇧+↵
          </kbd>
        </Button>
        {isBusy && (
          <span className="text-muted-foreground flex items-center gap-1 font-mono text-xs tabular-nums">
            <Timer className="size-3" />
            {(elapsed / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Right: theme + auth */}
      <div className="flex items-center gap-2">
        <AnimatedThemeToggler />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button"
                aria-label="Account menu"
                className="flex size-7 items-center justify-center rounded-full"
              >
                <Image
                  src={getAvatarUrl(user.username, 28)}
                  alt={user.name ?? "User"}
                  width={28}
                  height={28}
                  unoptimized
                  className="bg-muted size-7 rounded-full"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name ?? "User"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.username && (
                <DropdownMenuItem asChild>
                  <Link href={`/u/${user.username}`} className="cursor-pointer">
                    My Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openSignIn({ source: "problem-header" })}
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}

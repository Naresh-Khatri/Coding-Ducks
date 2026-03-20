"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, List, Loader2, Play, Send, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { AnimatedThemeToggler } from "~/components/ui/animated-theme-toggler";
import { Badge } from "~/components/ui/badge";
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
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  // Execution timer
  const isBusy = isRunning || isSubmitting;
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (isBusy) {
      startRef.current = Date.now();
      setElapsed(0);
      const id = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
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

  return (
    <div className="bg-background flex h-12 shrink-0 items-center justify-between border-b px-3">
      {/* Left: back + problems list */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/problems">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <List className="h-4 w-4" />
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
      </div>

      {/* Center: run + submit */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={!isAuthenticated || isRunning || isSubmitting}
          className="h-8 gap-1.5 px-4 text-xs font-medium"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
          <kbd className="text-muted-foreground/50 ml-1 hidden text-[10px] sm:inline">
            ⌘↵
          </kbd>
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!isAuthenticated || isRunning || isSubmitting}
          className="h-8 gap-1.5 bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Submit
          <kbd className="ml-1 hidden text-[10px] text-white/40 sm:inline">
            ⌘⇧↵
          </kbd>
        </Button>
        {isBusy && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-mono tabular-nums">
            <Timer className="h-3 w-3" />
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
              <button className="from-primary to-primary/60 text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr text-xs font-medium">
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name ?? "User"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
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
            onClick={async () => {
              await authClient.signIn.social({
                provider: "google",
                callbackURL: window.location.pathname,
              });
            }}
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}

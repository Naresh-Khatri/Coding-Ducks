"use client";

import { use, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, RotateCcw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import * as Y from "yjs";

import type { MachineCodingContext } from "~/components/machine-coding/types";
import { authClient } from "~/auth/client";
import { useWebContainerSupport } from "~/components/code-workspace/webcontainer-support";
import { CountdownTimer } from "~/components/countdown-timer";
import { ProblemNav } from "~/components/machine-coding/problem-nav";
import { ProblemSheet } from "~/components/machine-coding/problem-sheet";
import { VariantSelector } from "~/components/machine-coding/variant-selector";
import { machineCodingExtension } from "~/components/machine-coding/side-panel";
import { useSignIn } from "~/components/sign-in-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  clearLocalAttempt,
  patchLocalAttempt,
  readLocalAttempt,
  readVariantPref,
  writeVariantPref,
} from "~/lib/machine-coding/local-store";
import { useLocalMachineCodingDoc } from "~/lib/machine-coding/use-local-doc";
import { prewarmWebContainer } from "~/lib/webcontainer/boot";
import {
  gzipToBase64,
  supportsGzip,
  uint8ArrayToBase64,
} from "~/lib/yjs-base64";
import { useTRPC } from "~/trpc/react";

const Workspace = dynamic(
  () =>
    import("~/components/code-workspace/workspace").then((m) => m.Workspace),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
        Loading editor…
      </div>
    ),
  },
);

export default function MachineCodingProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const trpc = useTRPC();
  const { openSignIn } = useSignIn();

  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const { data: detail, error } = useQuery(
    trpc.machineCoding.problemBySlug.queryOptions(
      { slug },
      { enabled: !!slug },
    ),
  );

  // Per-category variant preference — a language for js-utility problems, a
  // framework for ui-component ones. Honored only when the problem offers that
  // variant; otherwise the base (React / TypeScript) variant is used.
  const variants = useMemo(() => detail?.problem.variants ?? [], [detail]);
  const [variantPref, setVariantPref] = useState<string | null>(null);
  useEffect(() => {
    if (!detail) return;
    // Intentional: read browser-only preference once the category is known.
    setVariantPref(readVariantPref(detail.problem.category));
  }, [detail]);
  const variant = useMemo(() => {
    const base = variants[0];
    if (!base) return undefined;
    if (variantPref && variants.some((v) => v.id === variantPref))
      return variantPref;
    return base.id;
  }, [variants, variantPref]);
  const setVariant = (id: string) => {
    if (detail) writeVariantPref(detail.problem.category, id);
    setVariantPref(id);
  };

  const { data: starter } = useQuery(
    trpc.machineCoding.getStarter.queryOptions(
      { slug, variant },
      { enabled: !!slug && !!detail },
    ),
  );

  const { ydoc, ready, reset } = useLocalMachineCodingDoc(
    slug,
    starter?.files,
    starter?.editablePaths,
    variant,
  );

  // Stamp (or read) the attempt start time so the countdown survives reloads.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const startAttempt = useMutation(
    trpc.machineCoding.startAttempt.mutationOptions(),
  );
  useEffect(() => {
    // Intentional: stamp/read browser-only start time on mount (hydration-safe).
    const meta = patchLocalAttempt(slug, {});
    setStartedAt(meta.startedAt);
    if (isSignedIn) startAttempt.mutate({ slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isSignedIn]);

  const createRoom = useMutation(
    trpc.machineCoding.createInterviewRoom.mutationOptions({
      onSuccess: ({ roomId }) => {
        clearLocalAttempt(slug);
        router.push(`/interview/${roomId}`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const handleInvite = async () => {
    if (!isSignedIn) {
      openSignIn({
        source: "machine-coding-invite",
        callbackURL: `/machine-coding/${slug}`,
      });
      return;
    }
    if (!ydoc) return;
    // Gzip the snapshot so the upload stays under the proxy's body limit; fall
    // back to raw base64 where CompressionStream isn't available.
    const update = Y.encodeStateAsUpdate(ydoc);
    if (supportsGzip()) {
      createRoom.mutate({ slug, yjsDataGz: await gzipToBase64(update) });
    } else {
      createRoom.mutate({ slug, yjsData: uint8ArrayToBase64(update) });
    }
  };

  const machineCodingContext: MachineCodingContext | null = useMemo(() => {
    if (!detail || startedAt == null) return null;
    return {
      slug,
      title: detail.problem.title,
      difficulty: detail.problem.difficulty,
      category: detail.problem.category,
      durationMinutes: detail.problem.durationMinutes,
      variant: variant ?? "base",
      variants,
      description: detail.problem.description,
      tags: detail.problem.tags,
      companies: detail.problem.companies,
      startedAt,
      solutionRevealed: readLocalAttempt(slug)?.revealed ?? false,
      isSignedIn,
      roomId: detail.attempt?.roomId ?? null,
      attempt: detail.attempt
        ? {
            status: detail.attempt.status,
            testsLastPassed: detail.attempt.testsLastPassed,
            testsLastTotal: detail.attempt.testsLastTotal,
          }
        : null,
    };
  }, [detail, startedAt, slug, isSignedIn, variant, variants]);

  // Open the file the candidate implements first — its starter stub carries a
  // `TODO` marker — instead of the demo entry file.
  const entryFile = useMemo(() => {
    if (!starter) return null;
    return (
      Object.keys(starter.files).find((p) =>
        starter.files[p]?.includes("TODO"),
      ) ?? null
    );
  }, [starter]);

  const ext = useMemo(
    () =>
      machineCodingContext
        ? machineCodingExtension(machineCodingContext)
        : null,
    [machineCodingContext],
  );

  // No cross-origin isolation → runtime can't boot; degrade, don't block.
  const support = useWebContainerSupport();

  // Warm it up while starter files load, so it isn't a cold start.
  useEffect(() => {
    if (support.checked && support.supported) prewarmWebContainer();
  }, [support.checked, support.supported]);

  if (error) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <h2 className="text-destructive text-xl font-bold">
          Problem not found
        </h2>
        <Button asChild>
          <Link href="/machine-coding">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  if (!support.checked || !detail) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="bg-muted/20 flex items-center justify-between gap-2 border-b px-2 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/machine-coding">
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <ProblemSheet currentSlug={slug} title={detail.problem.title} />
          <ProblemNav currentSlug={slug} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {variants.length > 1 && variant && (
            <VariantSelector
              options={variants}
              value={variant}
              onChange={setVariant}
            />
          )}

          <CountdownTimer
            defaultMinutes={detail.problem.durationMinutes}
            onComplete={() =>
              toast.warning(
                "Time's up — you can keep going as long as you like.",
              )
            }
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" title="Reset to starter code">
                <RotateCcw className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to the starter code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently discards your current code for this problem
                  and reloads the original starter files. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void reset()}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            onClick={() => void handleInvite()}
            disabled={createRoom.isPending}
            title="Turn this into a shared room and invite a candidate"
          >
            {createRoom.isPending ? (
              <Loader2 className="size-4 animate-spin sm:mr-1.5" />
            ) : (
              <UserPlus className="size-4 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">Invite a candidate</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {ready && ydoc && machineCodingContext && ext ? (
          <Workspace
            provider={null}
            ydoc={ydoc}
            aiEnabled={false}
            sidePanel={ext.sidePanel}
            bottomPanel={ext.bottomPanel}
            renderProvider={ext.renderProvider}
            entryFile={entryFile}
            editablePaths={starter?.editablePaths ?? null}
            terminalEnabled={false}
            // Pure JS-utility problems have no UI to preview — drop the preview
            // column and go two-column (problem statement + editor).
            previewEnabled={detail.problem.category !== "js-utility"}
            runtimeEnabled={support.supported}
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Preparing your workspace…
          </div>
        )}
      </div>
    </div>
  );
}

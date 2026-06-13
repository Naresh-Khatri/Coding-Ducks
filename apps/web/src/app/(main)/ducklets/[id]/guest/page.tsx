"use client";

import { use, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { ChevronLeft, Eye } from "lucide-react";
import * as Y from "yjs";

import { authClient } from "~/auth/client";
import { useWebContainerSupport } from "~/components/code-workspace/webcontainer-support";
import { useSignIn } from "~/components/sign-in-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { track } from "~/lib/analytics";
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

export default function GuestDuckletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomIdStr } = use(params);
  const roomId = parseInt(roomIdStr);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { openSignIn } = useSignIn();

  // Auth state
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Fetch ducklet data
  const {
    data: ducklet,
    isLoading: isDuckletLoading,
    error,
    refetch,
  } = useQuery(
    trpc.room.byId.queryOptions({ id: roomId }, { enabled: !!roomId }),
  );

  // Guests need realtime only to auto-redirect once the owner accepts (or
  // visibility flips). One SSE subscription, no websocket: refetch `byId` and
  // the redirect effect below reacts.
  useSubscription(
    trpc.room.onEvent.subscriptionOptions(
      { roomId },
      {
        enabled: !!roomId && !!ducklet?.isPublic,
        onData: (event) => {
          if (
            event.type === "members:changed" ||
            event.type === "visibility:changed"
          ) {
            void queryClient.invalidateQueries(
              trpc.room.byId.queryFilter({ id: roomId }),
            );
          }
        },
      },
    ),
  );

  useEffect(() => {
    track("ducklet-guest-view", { id: roomId, signedIn: !!userId });
  }, [roomId, userId]);

  // Build a local, non-collaborative Y.Doc from the fetched snapshot. The
  // read-only workspace renders + previews this; edits aren't synced anywhere.
  const localDoc = useMemo(() => {
    if (!ducklet?.yjsData) return null;
    try {
      const bytes = Uint8Array.from(atob(ducklet.yjsData), (c) =>
        c.charCodeAt(0),
      );
      const doc = new Y.Doc();
      Y.applyUpdate(doc, bytes);
      return doc;
    } catch (err) {
      console.error("Failed to decode ducklet snapshot:", err);
      return null;
    }
  }, [ducklet?.yjsData]);

  // Determine user status
  const isOwner = ducklet?.ownerId === userId;
  const userStatus = ducklet?.currentUserStatus;
  const isMember = userStatus === "active";

  useEffect(() => {
    if (isOwner || isMember) {
      router.push(`/ducklets/${roomId}`);
    }
  }, [isOwner, isMember, roomId, router]);

  const requestAccessMutation = useMutation(
    trpc.room.requestAccess.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const respondInviteMutation = useMutation(
    trpc.room.respondToInvite.mutationOptions({
      onSuccess: () => {
        router.push(`/ducklets/${roomId}`);
      },
    }),
  );

  // The runtime needs a cross-origin-isolated browser; where it can't boot we
  // still render the read-only workspace (just without preview) rather than
  // blocking the page (see Workspace `runtimeEnabled`).
  const support = useWebContainerSupport();

  // Hold on the spinner until the support check has run. `checked` stays false
  // across the isolation-recovery reload; deciding the layout before then would
  // flash the wrong mode.
  if (!support.checked || isDuckletLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Loading ducklet...
        </div>
      </div>
    );
  }

  if (error || !ducklet) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <h2 className="text-destructive text-xl font-bold">
          Error loading ducklet
        </h2>
        <p className="text-muted-foreground">
          {error?.message ?? "Ducklet not found"}
        </p>
        <Button onClick={() => router.push("/ducklets")}>Back to List</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="bg-muted/20 flex items-center justify-between gap-2 border-b px-2 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/ducklets">
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-semibold">{ducklet.name}</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground shrink-0 cursor-default gap-1 font-normal"
                  >
                    <Eye className="size-3" />
                    Read-only
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  You're viewing this public ducklet as a guest. It runs locally
                  in your browser; edits won't be saved or synced — request
                  access to collaborate.
                </TooltipContent>
              </Tooltip>
            </div>
            {ducklet.description && (
              <p className="text-muted-foreground hidden truncate text-xs sm:block">
                {ducklet.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Access Request UI */}
          {userId && userStatus === "invited" && (
            <div className="flex items-center gap-2 rounded bg-blue-500/10 px-2 py-1">
              <span className="text-xs">You are invited!</span>
              <Button
                size="sm"
                className="h-6 text-xs"
                onClick={() =>
                  respondInviteMutation.mutate({ roomId, accept: true })
                }
                disabled={respondInviteMutation.isPending}
              >
                Accept
              </Button>
            </div>
          )}

          {userId &&
            userStatus !== "invited" &&
            userStatus !== "requested" &&
            userStatus !== "active" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  track("ducklet-guest-cta", {
                    id: roomId,
                    action: "request-access",
                  });
                  requestAccessMutation.mutate({ roomId });
                }}
                disabled={requestAccessMutation.isPending}
              >
                Request Access
              </Button>
            )}

          {userId && userStatus === "requested" && (
            <Button size="sm" variant="secondary" disabled>
              Request Pending
            </Button>
          )}

          {!userId && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                track("ducklet-guest-cta", {
                  id: roomId,
                  action: "signin",
                });
                openSignIn({
                  source: "ducklet-guest",
                  callbackURL: `/ducklets/${roomId}/guest`,
                });
              }}
            >
              Sign In to Request Access
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {localDoc ? (
          <Workspace
            provider={null}
            ydoc={localDoc}
            readOnly
            runtimeEnabled={support.supported}
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            This ducklet has no content yet.
          </div>
        )}
      </div>
    </div>
  );
}

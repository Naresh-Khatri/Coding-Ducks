"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronLeft, Info } from "lucide-react";
import * as Y from "yjs";

import { authClient } from "~/auth/client";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useSocketDucklet } from "~/hooks/use-socket";
import { track } from "~/lib/analytics";
import { useTRPC } from "~/trpc/react";
import { GuestEditor } from "./guest-editor";

export default function GuestDuckletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: duckletIdStr } = use(params);
  const duckletId = parseInt(duckletIdStr);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Auth state
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const username = session?.user?.name ?? "Anonymous";
  const photoURL = session?.user?.image ?? undefined;

  // Fetch ducklet data
  const {
    data: ducklet,
    isLoading: isDuckletLoading,
    error,
    refetch,
  } = useQuery(
    trpc.ducklet.byId.queryOptions({ id: duckletId }, { enabled: !!duckletId }),
  );

  // Authed guests on a public ducklet get a `viewer` collab token from
  // the API, which lets them open a read-only Hocuspocus connection. We
  // use that connection purely to observe `meta` Y.Map updates so we
  // can auto-redirect once the owner accepts the access request.
  const { data: collabAuth } = useQuery(
    trpc.ducklet.getCollabToken.queryOptions(
      { duckletId },
      {
        enabled: !!duckletId && !!userId && !!ducklet?.isPublic,
        staleTime: 30 * 60 * 1000,
        // Owner cycling visibility / revoking access can flip this from
        // 200 to FORBIDDEN — don't loop on the error.
        retry: false,
      },
    ),
  );

  const { ydoc } = useSocketDucklet({
    duckletId: duckletIdStr,
    userId,
    username,
    photoURL,
    token: collabAuth?.token,
  });

  useEffect(() => {
    if (!ydoc) return;
    const meta = ydoc.getMap("meta");
    const onChange = () => {
      void queryClient.invalidateQueries(
        trpc.ducklet.byId.queryFilter({ id: duckletId }),
      );
    };
    meta.observe(onChange);
    return () => meta.unobserve(onChange);
  }, [ydoc, queryClient, trpc, duckletId]);

  useEffect(() => {
    track("ducklet-guest-view", { id: duckletId, signedIn: !!userId });
  }, [duckletId, userId]);

  // Local state for code (not synced)
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [head, setHead] = useState("");
  const [body, setBody] = useState("");

  // Initialize from ducklet's Y.js data
  useEffect(() => {
    if (!ducklet?.yjsData) return;

    try {
      // Decode base64 Y.js data
      const uint8Array = Uint8Array.from(atob(ducklet.yjsData), (c) =>
        c.charCodeAt(0),
      );
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, uint8Array);

      // Extract content
      const htmlContent = ydoc.getText("html").toString();
      const cssContent = ydoc.getText("css").toString();
      const jsContent = ydoc.getText("js").toString();

      setHtml(htmlContent);
      setCss(cssContent);
      setJs(jsContent);

      // Extract settings
      const settingsMap = ydoc.getMap("settings");
      const headScripts = settingsMap.get("headScripts") as string | undefined;
      const bodyScripts = settingsMap.get("bodyScripts") as string | undefined;

      setHead(headScripts ?? "");
      setBody(bodyScripts ?? "");
    } catch (err) {
      console.error("Failed to decode Y.js data:", err);
    }
  }, [ducklet?.yjsData]);

  // Determine user status
  const isOwner = ducklet?.ownerId === userId;
  const userStatus = ducklet?.currentUserStatus;
  const isMember = userStatus === "active";

  // Redirect if user has access
  useEffect(() => {
    if (isOwner || isMember) {
      router.push(`/ducklets/${duckletId}`);
    }
  }, [isOwner, isMember, duckletId, router]);

  const requestAccessMutation = useMutation(
    trpc.ducklet.requestAccess.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const respondInviteMutation = useMutation(
    trpc.ducklet.respondToInvite.mutationOptions({
      onSuccess: () => {
        router.push(`/ducklets/${duckletId}`);
      },
    }),
  );

  if (isDuckletLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Loading ducklet...
        </div>
      </div>
    );
  }

  if (error || !ducklet) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
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
      <header className="bg-muted/20 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Link href="/ducklets">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="font-semibold">{ducklet.name}</h1>
          <p className="text-muted-foreground text-xs">{ducklet.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Access Request UI */}
          {userId && userStatus === "invited" && (
            <div className="flex items-center gap-2 rounded bg-blue-500/10 px-2 py-1">
              <span className="text-xs">You are invited!</span>
              <Button
                size="sm"
                className="h-6 text-xs"
                onClick={() =>
                  respondInviteMutation.mutate({ duckletId, accept: true })
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
                    id: duckletId,
                    action: "request-access",
                  });
                  requestAccessMutation.mutate({ duckletId });
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
              asChild
              onClick={() =>
                track("ducklet-guest-cta", {
                  id: duckletId,
                  action: "signin",
                })
              }
            >
              <Link href="/auth/signin">Sign In to Request Access</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Guest Mode Banner */}
      <Alert className="m-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Guest Mode:</strong> You're viewing this public ducklet in
          read-only mode. You can edit the code locally, but changes won't be
          saved or synced. Request access to collaborate with full edit
          permissions.
        </AlertDescription>
      </Alert>

      <div className="flex-1 overflow-hidden">
        <GuestEditor
          html={html}
          css={css}
          js={js}
          head={head}
          body={body}
          onHtmlChange={setHtml}
          onCssChange={setCss}
          onJsChange={setJs}
        />
      </div>
    </div>
  );
}

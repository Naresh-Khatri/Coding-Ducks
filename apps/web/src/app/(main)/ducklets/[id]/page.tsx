"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import {
  ChevronLeft,
  Copy,
  Eye,
  Lock,
  MessageSquare,
  Pencil,
  Send,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { ChatMessage, UserPresence } from "~/hooks/use-socket";
import { authClient } from "~/auth/client";
import {
  DesktopOnlyGate,
  useWebContainerSupport,
} from "~/components/code-workspace/desktop-only-gate";
import { machineCodingExtension } from "~/components/machine-coding/side-panel";
import type { MachineCodingContext } from "~/components/machine-coding/types";
import { RenameDuckletDialog } from "~/components/ducklets/rename-ducklet-dialog";
import { ShareModal } from "~/components/ducklets/share-modal";
import { useSignIn } from "~/components/sign-in-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useIsMobile } from "~/hooks/use-is-mobile";
import { useSocketRoom } from "~/hooks/use-socket";
import { track } from "~/lib/analytics";
import { useTRPC } from "~/trpc/react";

// The workspace pulls in CodeMirror, xterm, and the WebContainer runtime —
// a heavy, browser-only bundle. Defer it until the page is interactive.
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

export default function DuckletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomIdStr } = use(params);
  const roomId = parseInt(roomIdStr);
  const router = useRouter();
  const trpc = useTRPC();

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
  } = useQuery(
    trpc.room.byId.queryOptions({ id: roomId }, { enabled: !!roomId }),
  );

  // Fetch a short-lived collab token. The websocket will not connect until
  // the server has authorized this user for this ducklet.
  const { data: collabAuth } = useQuery(
    trpc.room.getCollabToken.queryOptions(
      { roomId },
      { enabled: !!roomId && !!userId, staleTime: 30 * 60 * 1000 },
    ),
  );

  // Connect to Socket Server
  const { users, isConnected, provider, ydoc } = useSocketRoom({
    roomId: roomIdStr,
    userId,
    username,
    photoURL,
    token: collabAuth?.token,
  });

  const queryClient = useQueryClient();

  // Chat history from Postgres; live messages via the SSE subscription.
  // Flat oldest→newest list, deduped by id so the optimistic append and its
  // echo collapse to one.
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }, []);

  const { data: chatHistory } = useQuery(
    trpc.room.chatHistory.queryOptions(
      { roomId, limit: 50 },
      { enabled: !!roomId && !!userId, refetchOnWindowFocus: false },
    ),
  );

  useEffect(() => {
    if (!chatHistory) return;
    setMessages(
      [...chatHistory.items].reverse().map((m) => ({
        id: m.id,
        userId: m.userId ?? "",
        username: m.username,
        text: m.content,
        timestamp: m.createdAt.getTime(),
      })),
    );
  }, [chatHistory]);

  const sendMessageMutation = useMutation(
    trpc.room.sendMessage.mutationOptions({
      onError: (err) => toast.error(err.message),
    }),
  );

  // Realtime events over SSE (separate from the editor websocket).
  // Membership / visibility changes refetch `byId`; chat messages append.
  useSubscription(
    trpc.room.onEvent.subscriptionOptions(
      { roomId },
      {
        // Subscribe only after `byId` confirms read access.
        enabled: !!roomId && !!ducklet,
        onData: (event) => {
          if (
            event.type === "members:changed" ||
            event.type === "visibility:changed"
          ) {
            void queryClient.invalidateQueries(
              trpc.room.byId.queryFilter({ id: roomId }),
            );
          } else {
            // chat:message
            const m = event.message;
            appendMessage({
              id: m.id,
              userId: m.userId ?? "",
              username: m.username,
              text: m.content,
              timestamp: m.createdAt,
            });
          }
        },
      },
    ),
  );

  const [newMessage, setNewMessage] = useState("");
  const isMobile = useIsMobile();
  // Chat is closed by default; users open it from the header when they want it.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const forkMutation = useMutation(
    trpc.room.fork.mutationOptions({
      onSuccess: (forked) => {
        if (!forked) return;
        track("ducklet-fork", { from: "detail", sourceId: roomId });
        toast.success("Forked to your ducklets");
        void queryClient.invalidateQueries(
          trpc.room.list.infiniteQueryFilter(),
        );
        router.push(`/ducklets/${forked.id}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text || !userId) return;
    // Client-generated id: lets the server insert idempotently and lets us
    // dedup the broadcast echo of our own optimistic append.
    const id = `${Date.now()}-${userId}-${Math.random().toString(36).slice(2, 8)}`;
    appendMessage({ id, userId, username, text, timestamp: Date.now() });
    sendMessageMutation.mutate({ roomId, id, content: text });
    setNewMessage("");
  };

  // Determine Permissions
  const isOwner = ducklet?.ownerId === userId;
  const userStatus = ducklet?.currentUserStatus;
  const isMember = userStatus === "active";
  const myRole = ducklet?.members.find((m) => m.userId === userId)?.role;
  const canEdit = isOwner || (isMember && myRole === "editor");
  const isPublic = ducklet?.isPublic ?? false;

  // Notify the current user when the owner changes their permissions live
  // (members:changed → byId refetch updates `myRole`). We skip the owner
  // (whose role is undefined) and the initial load, only toasting on an
  // actual transition between known roles.
  const prevRoleRef = useRef<typeof myRole>(undefined);
  useEffect(() => {
    const prev = prevRoleRef.current;
    prevRoleRef.current = myRole;
    if (isOwner || !myRole || !prev || prev === myRole) return;
    toast.info(
      myRole === "editor"
        ? "You can now edit this ducklet"
        : "Your access is now view-only",
    );
  }, [myRole, isOwner]);

  // Redirect non-members to guest page for public ducklets
  // This also handles access revocation during active session
  useEffect(() => {
    if (ducklet && isPublic && !isOwner && !isMember) {
      router.push(`/ducklets/${roomId}/guest`);
    }
  }, [ducklet, isPublic, isOwner, isMember, roomId, router]);

  // Listen to websocket disconnects for access revocation
  useEffect(() => {
    if (!provider || !ducklet) return;

    const handleAuthFailure = (event: { reason?: string }) => {
      console.log("[Ducklet] Connection closed:", event);
      // If connection closes and ducklet is public, redirect to guest mode
      // This happens when server kicks user due to access revocation
      if (ducklet.isPublic && !isOwner) {
        router.push(`/ducklets/${roomId}/guest`);
      }
    };

    // Listen for authentication/permission errors
    provider.on("close", handleAuthFailure);
    provider.on("authenticationFailed", handleAuthFailure);

    return () => {
      provider.off("close", handleAuthFailure);
      provider.off("authenticationFailed", handleAuthFailure);
    };
  }, [provider, ducklet, isOwner, roomId, router]);

  // WebContainer is desktop Chromium/Firefox only — gate genuinely unsupported
  // browsers before rendering the workspace.
  const support = useWebContainerSupport();
  if (support.checked && !support.supported) {
    return <DesktopOnlyGate reason={support.reason} />;
  }

  // Hold on the spinner until the support check has run. `checked` stays false
  // across the isolation-recovery reload; mounting the workspace before then
  // would flash a runtime that can't boot.
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
    const code = error?.data?.code;
    if (code === "FORBIDDEN") {
      return <AccessDeniedScreen roomId={roomId} isAuthed={!!userId} />;
    }
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4">
        <h2 className="text-destructive text-xl font-bold">
          {code === "NOT_FOUND" ? "Ducklet not found" : "Error loading ducklet"}
        </h2>
        <p className="text-muted-foreground">
          {error?.message ?? "This ducklet does not exist."}
        </p>
        <Button onClick={() => router.push("/ducklets")}>Back to List</Button>
      </div>
    );
  }

  // Practice interview rooms render the workspace in practice mode (Problem
  // panel + countdown, AI off) and link back to the catalogue.
  const machineCodingContext: MachineCodingContext | null = ducklet.machineCodingContext
    ? {
        slug: ducklet.machineCodingContext.problemSlug,
        title: ducklet.machineCodingContext.title,
        difficulty: ducklet.machineCodingContext.difficulty,
        durationMinutes: ducklet.machineCodingContext.durationMinutes,
        description: ducklet.machineCodingContext.description,
        startedAt: new Date(ducklet.machineCodingContext.startedAt).getTime(),
        solutionRevealed: ducklet.machineCodingContext.solutionRevealed,
        isSignedIn: !!userId,
      }
    : null;

  const machineCodingExt = machineCodingContext
    ? machineCodingExtension(machineCodingContext)
    : null;

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="bg-muted/20 flex items-center justify-between gap-2 border-b px-2 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={
              machineCodingContext
                ? `/machine-coding/${machineCodingContext.slug}`
                : "/ducklets"
            }
          >
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
        <div className="min-w-0 flex-1 text-center">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setRenameOpen(true)}
              className="hover:text-primary block max-w-full truncate font-semibold transition-colors"
              title="Rename"
            >
              {ducklet.name}
            </button>
          ) : (
            <h1 className="truncate font-semibold">{ducklet.name}</h1>
          )}
          {ducklet.description && (
            <p className="text-muted-foreground hidden truncate text-xs sm:block">
              {ducklet.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-muted-foreground hidden shrink-0 cursor-default gap-1 font-normal sm:inline-flex"
              >
                {canEdit ? (
                  <>
                    <Pencil className="size-3" />
                    Can edit
                  </>
                ) : (
                  <>
                    <Eye className="size-3" />
                    Read-only
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {canEdit
                ? "You can edit this ducklet — your changes sync to everyone."
                : "You have view-only access. Ask the owner for editor access to make changes."}
            </TooltipContent>
          </Tooltip>

          <ConnectionBadge
            isConnected={isConnected}
            hasToken={!!collabAuth?.token}
          />

          {userId && !machineCodingContext && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => forkMutation.mutate({ id: roomId })}
              disabled={forkMutation.isPending}
              title="Fork this ducklet"
              aria-label="Fork ducklet"
            >
              <Copy className="size-4" />
            </Button>
          )}

          <ShareModal
            roomId={roomId}
            isOwner={isOwner}
            isPublic={isPublic}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={isChatOpen ? "bg-muted" : ""}
            title={isChatOpen ? "Hide Chat" : "Show Chat"}
            aria-label={isChatOpen ? "Hide chat" : "Show chat"}
          >
            <MessageSquare className="size-4" />
          </Button>

          <div className="hidden -space-x-2 sm:flex">
            {users.slice(0, 5).map((u) => (
              <Avatar key={u.id} className="border-background size-8 border-2">
                <AvatarImage src={u.photoURL} />
                <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {users.length > 5 && (
              <div className="bg-muted border-background flex size-8 items-center justify-center rounded-full border-2 text-xs">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Main Editor Area */}
          <ResizablePanel defaultSize={80} minSize={50}>
            {provider && ydoc ? (
              <Workspace
                provider={provider}
                ydoc={ydoc}
                readOnly={!canEdit}
                roomId={roomId}
                aiEnabled={!machineCodingContext}
                sidePanel={machineCodingExt?.sidePanel ?? null}
                bottomPanel={machineCodingExt?.bottomPanel ?? null}
                renderProvider={machineCodingExt?.renderProvider ?? null}
                editablePaths={
                  ducklet.machineCodingContext?.editablePaths ?? null
                }
                terminalEnabled={!machineCodingContext}
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                Connecting to room...
              </div>
            )}
          </ResizablePanel>

          {/* Chat sidebar — only on desktop. On mobile the chat lives in a
              fixed overlay rendered below so it can take the full viewport. */}
          {isChatOpen && !isMobile && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <ChatPanel
                  users={users}
                  messages={messages}
                  userId={userId}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  onSend={handleSendMessage}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {isChatOpen && isMobile && (
          <div className="bg-background fixed inset-0 z-40 flex flex-col md:hidden">
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2 font-medium">
                <MessageSquare className="size-4" />
                Chat & Users
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close chat"
              >
                <X className="size-4" />
              </Button>
            </div>
            <ChatPanel
              users={users}
              messages={messages}
              userId={userId}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={handleSendMessage}
              showHeader={false}
            />
          </div>
        )}
      </div>

      {isOwner && (
        <RenameDuckletDialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          roomId={roomId}
          currentName={ducklet.name}
        />
      )}
    </div>
  );
}

function ChatPanel({
  users,
  messages,
  userId,
  newMessage,
  setNewMessage,
  onSend,
  showHeader = true,
}: {
  users: UserPresence[];
  messages: ChatMessage[];
  userId: string | undefined;
  newMessage: string;
  setNewMessage: (val: string) => void;
  onSend: () => void;
  showHeader?: boolean;
}) {
  return (
    <div className="bg-muted/10 flex h-full flex-col border-l">
      {showHeader && (
        <div className="flex items-center gap-2 border-b p-3 font-medium">
          <MessageSquare className="size-4" />
          Chat & Users
        </div>
      )}

      <div className="border-b p-2">
        <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-semibold">
          <Users className="size-3" /> Online ({users.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {users.map((u) => (
            <div key={u.id} title={u.username} className="relative">
              <Avatar className="border-border size-6 border">
                <AvatarImage src={u.photoURL} />
                <AvatarFallback className="text-[9px]">
                  {u.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.userId === userId ? "items-end" : "items-start"
              }`}
            >
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {msg.username}
                </span>
                <span className="text-muted-foreground/70 text-[10px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  msg.userId === userId
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="bg-background border-t p-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type..."
            className="h-8"
          />
          <Button
            size="icon"
            onClick={onSend}
            className="size-8"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectionBadge({
  isConnected,
  hasToken,
}: {
  isConnected: boolean;
  hasToken: boolean;
}) {
  if (isConnected) {
    return (
      <span
        className="text-muted-foreground flex items-center gap-1 text-xs"
        title="Connected — changes sync in real time"
      >
        <Wifi className="size-3.5 text-emerald-500" />
        <span className="hidden sm:inline">Live</span>
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 text-xs text-amber-500"
      title={hasToken ? "Disconnected — reconnecting…" : "Connecting…"}
    >
      <WifiOff className="size-3.5 animate-pulse" />
      <span className="hidden sm:inline">
        {hasToken ? "Reconnecting…" : "Connecting…"}
      </span>
    </span>
  );
}

function AccessDeniedScreen({
  roomId,
  isAuthed,
}: {
  roomId: number;
  isAuthed: boolean;
}) {
  const trpc = useTRPC();
  const { openSignIn } = useSignIn();
  const requestAccess = useMutation(
    trpc.room.requestAccess.mutationOptions({
      onSuccess: (data, variables) => {
        track("ducklet-request-access", { id: variables.roomId });
        toast.success(data.message ?? "Request sent");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground size-7" />
      </div>
      <h2 className="text-2xl font-semibold">This ducklet is private</h2>
      <p className="text-muted-foreground">
        You don't have access to this ducklet. Ask the owner to invite you, or
        request access below.
      </p>
      <div className="flex gap-2">
        {isAuthed ? (
          <Button
            onClick={() => requestAccess.mutate({ roomId })}
            disabled={requestAccess.isPending || requestAccess.isSuccess}
          >
            {requestAccess.isSuccess
              ? "Request sent"
              : requestAccess.isPending
                ? "Requesting…"
                : "Request access"}
          </Button>
        ) : (
          <Button
            onClick={() =>
              openSignIn({
                source: "ducklet-access-denied",
                callbackURL: `/ducklets/${roomId}`,
              })
            }
          >
            Sign in to request access
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/ducklets">Back to list</Link>
        </Button>
      </div>
    </div>
  );
}

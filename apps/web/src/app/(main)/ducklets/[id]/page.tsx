"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Copy,
  Lock,
  MessageSquare,
  Send,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { ChatMessage, UserPresence } from "~/hooks/use-socket";
import { authClient } from "~/auth/client";
import { RenameDuckletDialog } from "~/components/collab-editor/rename-ducklet-dialog";
import { SettingsModal } from "~/components/collab-editor/settings-modal";
import { ShareModal } from "~/components/collab-editor/share-modal";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useIsMobile } from "~/hooks/use-is-mobile";
import { useSocketDucklet } from "~/hooks/use-socket";
import { useTRPC } from "~/trpc/react";

// CodeMirror + y-codemirror.next add ~200kB to the bundle. Defer them
// until the page is interactive so they don't block first paint.
const LayoutManager = dynamic(
  () =>
    import("~/components/collab-editor/layout-manager").then(
      (m) => m.LayoutManager,
    ),
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
  const { id: duckletIdStr } = use(params);
  const duckletId = parseInt(duckletIdStr);
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
    trpc.ducklet.byId.queryOptions({ id: duckletId }, { enabled: !!duckletId }),
  );

  // Fetch a short-lived collab token. The websocket will not connect until
  // the server has authorized this user for this ducklet.
  const { data: collabAuth } = useQuery(
    trpc.ducklet.getCollabToken.queryOptions(
      { duckletId },
      { enabled: !!duckletId && !!userId, staleTime: 30 * 60 * 1000 },
    ),
  );

  // Connect to Socket Server
  const {
    users,
    messages,
    isConnected,
    sendMessage,
    updateCursor,
    provider,
    ydoc,
  } = useSocketDucklet({
    duckletId: duckletIdStr,
    userId,
    username,
    photoURL,
    token: collabAuth?.token,
  });

  // Settings state - synced via Y.js Map
  const [head, setHead] = useState("");
  const [body, setBody] = useState("");

  // Sync head and body scripts from Y.js Map
  useEffect(() => {
    if (!ydoc) return;

    const settingsMap = ydoc.getMap("settings");

    const updateSettings = () => {
      const headScripts = settingsMap.get("headScripts") as string | undefined;
      const bodyScripts = settingsMap.get("bodyScripts") as string | undefined;

      setHead(headScripts ?? "");
      setBody(bodyScripts ?? "");
    };

    // Initial sync
    updateSettings();

    // Listen for changes
    settingsMap.observe(updateSettings);

    return () => {
      settingsMap.unobserve(updateSettings);
    };
  }, [ydoc]);

  // Update Y.js when head/body change
  const handleHeadChange = (value: string) => {
    if (!ydoc) return;
    const settingsMap = ydoc.getMap("settings");
    settingsMap.set("headScripts", value);
  };

  const handleBodyChange = (value: string) => {
    if (!ydoc) return;
    const settingsMap = ydoc.getMap("settings");
    settingsMap.set("bodyScripts", value);
  };

  const [newMessage, setNewMessage] = useState("");
  const isMobile = useIsMobile();
  // Chat collapses by default on mobile so editors get the full viewport.
  const [isChatOpen, setIsChatOpen] = useState(false);
  useEffect(() => {
    setIsChatOpen(!isMobile);
  }, [isMobile]);
  const [renameOpen, setRenameOpen] = useState(false);

  const queryClient = useQueryClient();
  const forkMutation = useMutation(
    trpc.ducklet.fork.mutationOptions({
      onSuccess: (forked) => {
        if (!forked) return;
        toast.success("Forked to your ducklets");
        void queryClient.invalidateQueries(
          trpc.ducklet.list.infiniteQueryFilter(),
        );
        router.push(`/ducklets/${forked.id}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  // Determine Permissions
  const isOwner = ducklet?.ownerId === userId;
  const userStatus = ducklet?.currentUserStatus;
  const isMember = userStatus === "active";
  const canEdit =
    isOwner ||
    (isMember &&
      ducklet?.members.find((m) => m.userId === userId)?.role === "editor");
  const isPublic = ducklet?.isPublic ?? false;

  // Redirect non-members to guest page for public ducklets
  // This also handles access revocation during active session
  useEffect(() => {
    if (ducklet && isPublic && !isOwner && !isMember) {
      router.push(`/ducklets/${duckletId}/guest`);
    }
  }, [ducklet, isPublic, isOwner, isMember, duckletId, router]);

  // Listen to websocket disconnects for access revocation
  useEffect(() => {
    if (!provider || !ducklet) return;

    const handleAuthFailure = (event: { reason?: string }) => {
      console.log("[Ducklet] Connection closed:", event);
      // If connection closes and ducklet is public, redirect to guest mode
      // This happens when server kicks user due to access revocation
      if (ducklet.isPublic && !isOwner) {
        router.push(`/ducklets/${duckletId}/guest`);
      }
    };

    // Listen for authentication/permission errors
    provider.on("close", handleAuthFailure);
    provider.on("authenticationFailed", handleAuthFailure);

    return () => {
      provider.off("close", handleAuthFailure);
      provider.off("authenticationFailed", handleAuthFailure);
    };
  }, [provider, ducklet, isOwner, duckletId, router]);

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
    const code = error?.data?.code;
    if (code === "FORBIDDEN") {
      return <AccessDeniedScreen duckletId={duckletId} isAuthed={!!userId} />;
    }
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
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

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="bg-muted/20 flex items-center justify-between gap-2 border-b px-2 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/ducklets">
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <ChevronLeft className="h-4 w-4" />
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
          <ConnectionBadge
            isConnected={isConnected}
            hasToken={!!collabAuth?.token}
          />

          {userId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => forkMutation.mutate({ id: duckletId })}
              disabled={forkMutation.isPending}
              title="Fork this ducklet"
              aria-label="Fork ducklet"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}

          <SettingsModal
            head={head}
            onHeadChange={handleHeadChange}
            body={body}
            onBodyChange={handleBodyChange}
          />

          <ShareModal
            duckletId={duckletId}
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
            <MessageSquare className="h-4 w-4" />
          </Button>

          <div className="hidden -space-x-2 sm:flex">
            {users.slice(0, 5).map((u) => (
              <Avatar key={u.id} className="border-background h-8 w-8 border-2">
                <AvatarImage src={u.photoURL} />
                <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {users.length > 5 && (
              <div className="bg-muted border-background flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs">
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
              <LayoutManager
                provider={provider}
                ydoc={ydoc}
                head={head}
                body={body}
                readOnly={!canEdit}
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
                <MessageSquare className="h-4 w-4" />
                Chat & Users
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
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
          duckletId={duckletId}
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
          <MessageSquare className="h-4 w-4" />
          Chat & Users
        </div>
      )}

      <div className="border-b p-2">
        <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-semibold">
          <Users className="h-3 w-3" /> Online ({users.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {users.map((u) => (
            <div key={u.id} title={u.username} className="relative">
              <Avatar className="border-border h-6 w-6 border">
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
            className="h-8 w-8"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
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
        <Wifi className="h-3.5 w-3.5 text-emerald-500" />
        <span className="hidden sm:inline">Live</span>
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 text-xs text-amber-500"
      title={hasToken ? "Disconnected — reconnecting…" : "Connecting…"}
    >
      <WifiOff className="h-3.5 w-3.5 animate-pulse" />
      <span className="hidden sm:inline">
        {hasToken ? "Reconnecting…" : "Connecting…"}
      </span>
    </span>
  );
}

function AccessDeniedScreen({
  duckletId,
  isAuthed,
}: {
  duckletId: number;
  isAuthed: boolean;
}) {
  const trpc = useTRPC();
  const requestAccess = useMutation(
    trpc.ducklet.requestAccess.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message ?? "Request sent");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <Lock className="text-muted-foreground h-7 w-7" />
      </div>
      <h2 className="text-2xl font-semibold">This ducklet is private</h2>
      <p className="text-muted-foreground">
        You don't have access to this ducklet. Ask the owner to invite you, or
        request access below.
      </p>
      <div className="flex gap-2">
        {isAuthed ? (
          <Button
            onClick={() => requestAccess.mutate({ duckletId })}
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
              authClient.signIn.social({
                provider: "google",
                callbackURL: `/ducklets/${duckletId}`,
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

"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MessageSquare, Send, Users } from "lucide-react";

import { authClient } from "~/auth/client";
import { LayoutManager } from "~/components/collab-editor/layout-manager";
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
import { useSocketDucklet } from "~/hooks/use-socket";
import { useTRPC } from "~/trpc/react";

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

  // Connect to Socket Server
  const { users, messages, sendMessage, updateCursor, provider, ydoc } =
    useSocketDucklet({
      duckletId: duckletIdStr,
      userId,
      username,
      photoURL,
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
  const [isChatOpen, setIsChatOpen] = useState(true);

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
          {/* Settings Modal */}
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
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <div className="flex -space-x-2">
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

          {isChatOpen && <ResizableHandle />}

          {/* Chat Sidebar */}
          {isChatOpen && (
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="bg-muted/10 flex h-full flex-col border-l">
                <div className="flex items-center gap-2 border-b p-3 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Chat & Users
                </div>

                {/* Online Users List (Compact) */}
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
                        className={`flex flex-col ${msg.userId === userId ? "items-end" : "items-start"}`}
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
                          className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${msg.userId === userId
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
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Type..."
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      className="h-8 w-8"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

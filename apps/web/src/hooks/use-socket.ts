"use client";

import { useEffect, useMemo, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

// Chat lives in Postgres, not the Y.Doc — delivered live via the
// `ducklet.onEvent` SSE subscription. This is the chat panel's view shape;
// messages come from `ducklet.chatHistory` + the `chat:message` event. The
// websocket this hook manages now only carries editor state and presence.

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

interface UseSocketDuckletOptions {
  duckletId: string;
  userId?: string;
  username: string;
  photoURL?: string;
  /** Server-signed collab token. Connection is deferred until this is set. */
  token?: string;
}

export interface UserPresence {
  id: string;
  username: string;
  photoURL?: string;
  cursor?: { line: number; column: number };
  color?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

function getRandomColor() {
  const colors = [
    "#f87171",
    "#fb923c",
    "#fbbf24",
    "#a3e635",
    "#4ade80",
    "#34d399",
    "#22d3ee",
    "#60a5fa",
    "#818cf8",
    "#c084fc",
    "#e879f9",
    "#f472b6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useSocketDucklet({
  duckletId,
  userId,
  username,
  photoURL,
  token,
}: UseSocketDuckletOptions) {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // duckletId is intentionally in deps to recreate Y.Doc when the room changes, even though it's not referenced in the factory
  const ydoc = useMemo(() => new Y.Doc(), [duckletId]);

  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const userColor = useMemo(() => getRandomColor(), []);

  useEffect(() => {
    if (!userId || !token) return;

    const wsUrl = SOCKET_URL.replace(/^http/, "ws");

    const newProvider = new HocuspocusProvider({
      url: wsUrl,
      name: `ducklet-${duckletId}`,
      document: ydoc,
      token,
      onConnect: () => {
        setIsConnected(true);
        newProvider.setAwarenessField("user", {
          id: userId,
          name: username,
          photoURL,
          color: userColor,
        });
      },
      onDisconnect: () => setIsConnected(false),
      onClose: () => setIsConnected(false),
      onDestroy: () => setIsConnected(false),
    });

    setProvider(newProvider);

    newProvider.setAwarenessField("user", {
      id: userId,
      name: username,
      photoURL,
      color: userColor,
    });

    const handleAwarenessUpdate = () => {
      const states = newProvider.awareness!.getStates();
      const activeUsers: UserPresence[] = [];

      states.forEach((state) => {
        const user = (state as { user?: UserPresence }).user;
        if (user) {
          activeUsers.push({
            id: user.id,
            username: user.username ?? (user as { name?: string }).name ?? "",
            photoURL: user.photoURL,
            cursor: user.cursor,
            color: user.color,
          });
        }
      });
      setUsers(activeUsers);
    };

    newProvider.awareness!.on("change", handleAwarenessUpdate);

    return () => {
      newProvider.awareness!.off("change", handleAwarenessUpdate);
      newProvider.destroy();
    };
  }, [duckletId, userId, username, photoURL, userColor, ydoc, token]);

  return {
    users,
    isConnected,
    provider,
    ydoc,
  };
}

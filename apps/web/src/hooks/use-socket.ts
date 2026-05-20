"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Y.Doc should be recreated if the duckletId changes to ensure clean state
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

    const messagesArray = ydoc.getArray<ChatMessage>("messages");

    const updateMessages = () => {
      setMessages(messagesArray.toArray());
    };

    messagesArray.observe(updateMessages);
    updateMessages();

    return () => {
      newProvider.destroy();
    };
  }, [duckletId, userId, username, photoURL, userColor, ydoc, token]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!ydoc || !userId) return;

      const message: ChatMessage = {
        id: `${Date.now()}-${userId}`,
        userId,
        username,
        text,
        timestamp: Date.now(),
      };

      const messagesArray = ydoc.getArray<ChatMessage>("messages");
      messagesArray.push([message]);

      if (messagesArray.length > 500) {
        messagesArray.delete(0, messagesArray.length - 500);
      }
    },
    [userId, username, ydoc],
  );

  const updateCursor = useCallback(
    (position: { line: number; column: number }) => {
      if (!provider) return;
      provider.setAwarenessField("user", {
        id: userId,
        name: username,
        photoURL,
        color: userColor,
        cursor: position,
      });
    },
    [provider, userId, username, photoURL, userColor],
  );

  return {
    users,
    messages,
    isConnected,
    sendMessage,
    updateCursor,
    provider,
    ydoc,
  };
}

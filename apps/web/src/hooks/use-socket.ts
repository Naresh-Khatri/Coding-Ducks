"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

interface UseSocketDuckletOptions {
  duckletId: string;
  userId?: string;
  username: string;
  photoURL?: string;
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
}: UseSocketDuckletOptions) {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Y.Doc should be recreated if the duckletId changes to ensure clean state
  const ydoc = useMemo(() => {
    console.log(
      `[useSocketDucklet] Creating new Y.Doc for ducklet: ${duckletId}`,
    );
    return new Y.Doc();
  }, [duckletId]);

  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const userColor = useMemo(() => getRandomColor(), []);

  useEffect(() => {
    console.log(
      `[useSocketDucklet] Connecting to ${SOCKET_URL} for ducklet ${duckletId}...`,
    );
    if (!userId) return;

    // Connect to Hocuspocus Server
    const wsUrl = `${SOCKET_URL.replace(/^http/, "ws")}?userId=${userId}`;

    const newProvider = new HocuspocusProvider({
      url: wsUrl,
      name: `ducklet-${duckletId}`,
      document: ydoc,
      onConnect: () => {
        console.log(`[useSocketDucklet] Connected to ${duckletId}`);
        setIsConnected(true);
        // Broadcast presence immediately on connection
        newProvider.setAwarenessField("user", {
          id: userId,
          name: username,
          photoURL,
          color: userColor,
        });
      },
      onDisconnect: () => {
        console.log(`[useSocketDucklet] Disconnected from ${duckletId}`);
        setIsConnected(false);
      },
      onClose: () => {
        console.log(`[useSocketDucklet] Connection closed for ${duckletId}`);
        setIsConnected(false);
      },
      onDestroy: () => {
        console.log(`[useSocketDucklet] Provider destroyed for ${duckletId}`);
        setIsConnected(false);
      },
    });

    setProvider(newProvider);

    // Set local awareness immediately (updates local state, will sync when connected)
    newProvider.setAwarenessField("user", {
      id: userId,
      name: username,
      photoURL,
      color: userColor,
    });

    // Sync users from awareness
    const handleAwarenessUpdate = () => {
      const states = newProvider.awareness!.getStates();
      const activeUsers: UserPresence[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          activeUsers.push({
            id: state.user.id,
            username: state.user.name,
            photoURL: state.user.photoURL,
            cursor: state.user.cursor,
            color: state.user.color,
          });
        }
      });
      console.log(
        `[useSocketDucklet] Awareness update. Active users: ${activeUsers.length}`,
      );
      setUsers(activeUsers);
    };

    newProvider.awareness!.on("change", handleAwarenessUpdate);

    // Sync messages from Y.Array
    const messagesArray = ydoc.getArray<ChatMessage>("messages");

    const updateMessages = () => {
      const msgs = messagesArray.toArray();
      console.log(`[useSocketDucklet] Messages updated. Count: ${msgs.length}`);
      setMessages(msgs);
    };

    messagesArray.observe(updateMessages);
    updateMessages(); // Initial sync

    return () => {
      console.log(`[useSocketDucklet] Cleaning up provider for ${duckletId}`);
      newProvider.destroy();
      // We don't destroy ydoc here because it's managed by useMemo
    };
  }, [duckletId, userId, username, photoURL, userColor, ydoc]);

  // Send chat message
  const sendMessage = useCallback(
    (text: string) => {
      if (!ydoc) return;

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

  // Update cursor position
  const updateCursor = useCallback(
    (position: { line: number; column: number }) => {
      if (!provider) return;

      // HocuspocusProvider convenience method
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

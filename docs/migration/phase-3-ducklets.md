# Phase 3: Ducklets (Collaborative Rooms)

> **Prerequisite**: Complete [Phase 1: Foundation](./phase-1-foundation.md) first.

---

## Goals

1. ✅ PartyKit setup for real-time collaboration
2. ✅ Rooms list and creation
3. ✅ Collaborative code editor with Yjs
4. ✅ Room member management
5. ✅ Chat and presence indicators
6. ✅ Web playground mode (HTML/CSS/JS preview)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Ducklet Editor Page                        ││
│  │  ┌──────────────────────────────────────────────────────┐  ││
│  │  │  Users Online    │  File Tree  │  Code Editor        │  ││
│  │  │  [🟢 User1]     │  📁 src/    │  (Yjs + CodeMirror) │  ││
│  │  │  [🟢 User2]     │    main.py  │                      │  ││
│  │  │                 │             │  ───────────────────  │  ││
│  │  │  💬 Chat        │             │  Console Output      │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │                    │
          │ WebSocket          │ tRPC (HTTP)
          ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐
│    PartyKit         │  │    tRPC Server      │
│  (Real-time sync)   │  │  (CRUD operations)  │
│  - Yjs documents    │  │  - Room management  │
│  - Presence         │  │  - Member roles     │
│  - Chat messages    │  │  - Persistence      │
└─────────────────────┘  └─────────────────────┘
```

---

## Ticket 3.1: PartyKit Setup

### Create PartyKit Package

```
packages/partykit/
├── package.json
├── partykit.json
├── src/
│   ├── server.ts      # Main PartyKit server
│   └── types.ts       # Shared types
└── tsconfig.json
```

### `packages/partykit/package.json`

```json
{
  "name": "@acme/partykit",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/server.ts",
  "scripts": {
    "dev": "partykit dev",
    "deploy": "partykit deploy"
  },
  "dependencies": {
    "partykit": "^0.0.108",
    "y-partykit": "^0.0.25",
    "yjs": "^13.6.10"
  }
}
```

### `packages/partykit/partykit.json`

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "coding-ducks",
  "main": "src/server.ts",
  "compatibilityDate": "2024-01-01"
}
```

### `packages/partykit/src/types.ts`

```typescript
// Message types for PartyKit communication
export type PartyMessage =
  | { type: "chat"; userId: string; username: string; text: string; timestamp: number }
  | { type: "cursor"; userId: string; position: { line: number; column: number } }
  | { type: "presence"; userId: string; username: string; photoURL?: string; action: "join" | "leave" }
  | { type: "sync"; data: unknown };

export interface RoomState {
  users: Map<string, UserPresence>;
  messages: ChatMessage[];
}

export interface UserPresence {
  id: string;
  username: string;
  photoURL?: string;
  cursor?: { line: number; column: number };
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}
```

### `packages/partykit/src/server.ts`

```typescript
import type * as Party from "partykit/server";
import { onConnect, unstable_getYDoc } from "y-partykit";
import * as Y from "yjs";
import type { PartyMessage, UserPresence, ChatMessage } from "./types";

// Store for room state
const roomState: Map<string, { users: Map<string, UserPresence>; messages: ChatMessage[] }> = new Map();

export default class RoomServer implements Party.Server {
  constructor(public room: Party.Room) {}

  // Get or create room state
  private getState() {
    if (!roomState.has(this.room.id)) {
      roomState.set(this.room.id, {
        users: new Map(),
        messages: [],
      });
    }
    return roomState.get(this.room.id)!;
  }

  // Handle Yjs document sync
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Parse user info from URL params
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username") ?? "Anonymous";
    const photoURL = url.searchParams.get("photoURL") ?? undefined;

    if (userId) {
      const state = this.getState();
      
      // Add user to presence
      state.users.set(userId, {
        id: userId,
        username,
        photoURL,
        lastSeen: Date.now(),
      });

      // Broadcast presence update
      this.room.broadcast(
        JSON.stringify({
          type: "presence",
          userId,
          username,
          photoURL,
          action: "join",
        } satisfies PartyMessage)
      );

      // Send current state to new connection
      conn.send(
        JSON.stringify({
          type: "sync",
          data: {
            users: Array.from(state.users.values()),
            messages: state.messages.slice(-100), // Last 100 messages
          },
        })
      );
    }

    // Handle Yjs sync
    return onConnect(conn, this.room, {
      persist: true, // Enable persistence
    });
  }

  async onClose(conn: Party.Connection) {
    // Get userId from connection state
    const userId = (conn as any).userId;
    if (!userId) return;

    const state = this.getState();
    const user = state.users.get(userId);

    if (user) {
      state.users.delete(userId);

      // Broadcast leave
      this.room.broadcast(
        JSON.stringify({
          type: "presence",
          userId,
          username: user.username,
          action: "leave",
        } satisfies PartyMessage)
      );
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const parsed = JSON.parse(message) as PartyMessage;

      switch (parsed.type) {
        case "chat": {
          const state = this.getState();
          const chatMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            userId: parsed.userId,
            username: parsed.username,
            text: parsed.text,
            timestamp: parsed.timestamp,
          };
          
          state.messages.push(chatMessage);
          
          // Keep only last 500 messages
          if (state.messages.length > 500) {
            state.messages = state.messages.slice(-500);
          }

          // Broadcast to all clients
          this.room.broadcast(message);
          break;
        }

        case "cursor": {
          const state = this.getState();
          const user = state.users.get(parsed.userId);
          if (user) {
            user.cursor = parsed.position;
            user.lastSeen = Date.now();
          }
          
          // Broadcast cursor update to others
          this.room.broadcast(message, [sender.id]);
          break;
        }
      }
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  }

  // Get Yjs document for a room
  getYDoc(): Y.Doc {
    return unstable_getYDoc(this.room);
  }
}
```

### Deploy Command

```bash
cd packages/partykit
pnpm deploy
```

After deploy, you'll get a URL like: `https://coding-ducks.your-username.partykit.dev`

---

## Ticket 3.2: Room tRPC Router

### File: `packages/api/src/router/room.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { room, roomMember, userProfile } from "@acme/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

export const roomRouter = createTRPCRouter({
  /**
   * List rooms (public + user's private rooms)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
        onlyMine: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset, onlyMine } = input ?? {};

      // Build conditions
      const conditions = [];
      
      if (ctx.session?.user && onlyMine) {
        // Only user's rooms
        conditions.push(eq(room.ownerId, ctx.session.user.id));
      } else if (ctx.session?.user) {
        // Public rooms + user's private rooms
        conditions.push(
          or(
            eq(room.isPublic, true),
            eq(room.ownerId, ctx.session.user.id)
          )
        );
      } else {
        // Only public rooms for anonymous users
        conditions.push(eq(room.isPublic, true));
      }

      const rooms = await ctx.db
        .select({
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.isPublic,
          roomType: room.roomType,
          previewImage: room.previewImage,
          createdAt: room.createdAt,
          owner: {
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          },
        })
        .from(room)
        .leftJoin(userProfile, eq(room.ownerId, userProfile.userId))
        .where(and(...conditions))
        .orderBy(desc(room.createdAt))
        .limit(limit)
        .offset(offset);

      return rooms;
    }),

  /**
   * Get room by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      // Check access
      if (!result.isPublic && result.ownerId !== ctx.session?.user?.id) {
        // Check if user is a member
        if (ctx.session?.user) {
          const [membership] = await ctx.db
            .select()
            .from(roomMember)
            .where(
              and(
                eq(roomMember.roomId, input.id),
                eq(roomMember.userId, ctx.session.user.id)
              )
            )
            .limit(1);

          if (!membership) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        } else {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      // Get members
      const members = await ctx.db
        .select({
          userId: roomMember.userId,
          role: roomMember.role,
          username: userProfile.username,
          photoURL: userProfile.photoURL,
        })
        .from(roomMember)
        .leftJoin(userProfile, eq(roomMember.userId, userProfile.userId))
        .where(eq(roomMember.roomId, input.id));

      // Get owner info
      const [owner] = await ctx.db
        .select({
          username: userProfile.username,
          photoURL: userProfile.photoURL,
        })
        .from(userProfile)
        .where(eq(userProfile.userId, result.ownerId));

      return {
        ...result,
        owner,
        members,
      };
    }),

  /**
   * Create a new room
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isPublic: z.boolean().default(true),
        roomType: z.enum(["normal", "web"]).default("normal"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newRoom] = await ctx.db
        .insert(room)
        .values({
          ...input,
          ownerId: ctx.session.user.id,
        })
        .returning();

      return newRoom;
    }),

  /**
   * Update room settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        contentHTML: z.string().optional(),
        contentCSS: z.string().optional(),
        contentJS: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, id))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(room)
        .set(updates)
        .where(eq(room.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete room
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.id))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(room).where(eq(room.id, input.id));
      return { success: true };
    }),

  /**
   * Add member to room
   */
  addMember: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userId: z.string(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.insert(roomMember).values({
        roomId: input.roomId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  /**
   * Remove member from room
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, input.userId)
          )
        );

      return { success: true };
    }),
});
```

---

## Ticket 3.3: PartyKit React Hooks

### File: `apps/web/src/hooks/use-partykit.ts`

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import usePartySocket from "partysocket/react";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import type { PartyMessage, UserPresence, ChatMessage } from "@acme/partykit/types";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "coding-ducks.your-username.partykit.dev";

interface UsePartyRoomOptions {
  roomId: string;
  userId: string;
  username: string;
  photoURL?: string;
}

export function usePartyRoom({ roomId, userId, username, photoURL }: UsePartyRoomOptions) {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const ydocRef = useRef<Y.Doc | null>(null);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: `room-${roomId}`,
    query: {
      userId,
      username,
      photoURL: photoURL ?? "",
    },
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data) as PartyMessage;

        switch (message.type) {
          case "sync":
            // Initial sync
            setUsers(message.data.users);
            setMessages(message.data.messages);
            break;

          case "presence":
            if (message.action === "join") {
              setUsers((prev) => [
                ...prev.filter((u) => u.id !== message.userId),
                {
                  id: message.userId,
                  username: message.username,
                  photoURL: message.photoURL,
                  lastSeen: Date.now(),
                },
              ]);
            } else {
              setUsers((prev) => prev.filter((u) => u.id !== message.userId));
            }
            break;

          case "chat":
            setMessages((prev) => [
              ...prev,
              {
                id: `${message.timestamp}-${message.userId}`,
                userId: message.userId,
                username: message.username,
                text: message.text,
                timestamp: message.timestamp,
              },
            ]);
            break;

          case "cursor":
            setUsers((prev) =>
              prev.map((u) =>
                u.id === message.userId
                  ? { ...u, cursor: message.position, lastSeen: Date.now() }
                  : u
              )
            );
            break;
        }
      } catch (e) {
        // Might be Yjs binary message
      }
    },
  });

  // Send chat message
  const sendMessage = useCallback(
    (text: string) => {
      if (!socket) return;

      const message: PartyMessage = {
        type: "chat",
        userId,
        username,
        text,
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    },
    [socket, userId, username]
  );

  // Update cursor position
  const updateCursor = useCallback(
    (position: { line: number; column: number }) => {
      if (!socket) return;

      const message: PartyMessage = {
        type: "cursor",
        userId,
        position,
      };

      socket.send(JSON.stringify(message));
    },
    [socket, userId]
  );

  // Get Yjs document for collaborative editing
  const getYDoc = useCallback(() => {
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }
    return ydocRef.current;
  }, []);

  return {
    users,
    messages,
    isConnected,
    sendMessage,
    updateCursor,
    getYDoc,
    socket,
  };
}
```

---

## Ticket 3.4: Collaborative Editor Component

### File: `apps/web/src/components/collab-editor/index.tsx`

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface CollabEditorProps {
  roomId: string;
  userId: string;
  username: string;
  language?: "js" | "py" | "cpp" | "html" | "css";
  onCursorChange?: (position: { line: number; column: number }) => void;
}

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "coding-ducks.your-username.partykit.dev";

const languageExtensions = {
  js: () => javascript(),
  py: () => python(),
  cpp: () => cpp(),
  html: () => html(),
  css: () => css(),
};

export function CollabEditor({
  roomId,
  userId,
  username,
  language = "py",
  onCursorChange,
}: CollabEditorProps) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Initialize Yjs
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect to PartyKit via y-websocket protocol
    const provider = new WebsocketProvider(
      `wss://${PARTYKIT_HOST}/party/room-${roomId}`,
      `room-${roomId}`,
      ydoc
    );
    providerRef.current = provider;

    // Set awareness (user info for cursors)
    provider.awareness.setLocalStateField("user", {
      id: userId,
      name: username,
      color: getRandomColor(),
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, userId, username]);

  const extensions = useMemo(() => {
    if (!ydocRef.current || !providerRef.current) return [];

    const ytext = ydocRef.current.getText("codemirror");
    const langExt = languageExtensions[language];

    return [
      langExt(),
      yCollab(ytext, providerRef.current.awareness),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" },
      }),
    ];
  }, [language, ydocRef.current, providerRef.current]);

  if (!ydocRef.current) {
    return <div>Connecting...</div>;
  }

  return (
    <CodeMirror
      value=""
      extensions={extensions}
      theme={oneDark}
      className="h-full"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
      }}
    />
  );
}

function getRandomColor(): string {
  const colors = [
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

---

## Ticket 3.5: Ducklets List Page

### File: `apps/web/src/app/(main)/ducklets/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Plus, Users, Lock, Globe, Code2 } from "lucide-react";

export default function DuckletsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: rooms, isLoading } = api.room.list.useQuery();
  const createMutation = api.room.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      // Refetch rooms
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
    roomType: "normal" as "normal" | "web",
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ducklets</h1>
          <p className="text-muted-foreground">
            Collaborative coding rooms for pair programming
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ducklet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ducklet</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My awesome project"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this ducklet about?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Room Type</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(v) => setFormData({ ...formData, roomType: v as "normal" | "web" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <div className="flex items-center">
                        <Code2 className="h-4 w-4 mr-2" />
                        Code (Python, JS, etc.)
                      </div>
                    </SelectItem>
                    <SelectItem value="web">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Web (HTML/CSS/JS)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can join this room
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!formData.name || createMutation.isLoading}
              >
                Create Ducklet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room) => (
          <Link key={room.id} href={`/ducklets/${room.id}`}>
            <div className="group rounded-lg border bg-card p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {room.description}
                    </p>
                  )}
                </div>
                {room.isPublic ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={room.owner?.photoURL ?? undefined} />
                    <AvatarFallback>
                      {room.owner?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {room.owner?.username}
                  </span>
                </div>

                <Badge variant="secondary">
                  {room.roomType === "web" ? "Web" : "Code"}
                </Badge>
              </div>
            </div>
          </Link>
        ))}

        {!isLoading && rooms?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No ducklets yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Ticket 3.6: Ducklet Editor Page

### File: `apps/web/src/app/(main)/ducklets/[id]/page.tsx`

```tsx
"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { usePartyRoom } from "~/hooks/use-partykit";
import { CollabEditor } from "~/components/collab-editor";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Settings, Send, Users, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useSession } from "~/auth/client";

export default function DuckletPage() {
  const params = useParams();
  const roomId = params.id as string;

  const { data: session } = useSession();
  const { data: room, isLoading } = api.room.byId.useQuery({ id: Number(roomId) });

  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);

  const {
    users,
    messages,
    isConnected,
    sendMessage,
  } = usePartyRoom({
    roomId,
    userId: session?.user?.id ?? "anonymous",
    username: session?.user?.name ?? "Anonymous",
    photoURL: session?.user?.image ?? undefined,
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Sidebar - Users & Chat */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col border-r">
            {/* Room Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold truncate">{room.name}</h2>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Users className="h-4 w-4" />
                Online ({users.length})
              </div>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Chat</span>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{msg.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Editor */}
        <ResizablePanel defaultSize={80}>
          {room.roomType === "web" ? (
            <WebPlayground roomId={roomId} initialContent={room} />
          ) : (
            <CollabEditor
              roomId={roomId}
              userId={session?.user?.id ?? "anonymous"}
              username={session?.user?.name ?? "Anonymous"}
              language="py"
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// Web playground component for HTML/CSS/JS rooms
function WebPlayground({ roomId, initialContent }) {
  // Implementation similar to old DuckletViews.tsx
  // Three editors (HTML, CSS, JS) + live preview iframe
  return (
    <div className="h-full">
      {/* TODO: Implement web playground with live preview */}
      <div className="p-4 text-muted-foreground">
        Web playground coming soon...
      </div>
    </div>
  );
}
```

---

## Dependencies to Install

```bash
# In packages/partykit
pnpm add partykit y-partykit yjs

# In apps/web
pnpm add partysocket y-codemirror.next y-websocket yjs

# shadcn components
pnpm dlx shadcn@latest add dialog textarea switch scroll-area avatar
```

---

## Environment Variables

```env
# For frontend
NEXT_PUBLIC_PARTYKIT_HOST=coding-ducks.your-username.partykit.dev
```

---

## Verification Checklist

- [ ] PartyKit deploys successfully
- [ ] `/ducklets` page loads and shows rooms
- [ ] Create new room works
- [ ] Room page loads with editor
- [ ] Multiple users see each other's cursors
- [ ] Chat messages are delivered in real-time
- [ ] Edits sync across browser tabs

---

## Next Phase

After completing Phase 3, proceed to [Phase 4: UI Challenges](./phase-4-ui-challenges.md).

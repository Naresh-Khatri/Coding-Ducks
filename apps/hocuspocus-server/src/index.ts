import { createServer } from "node:http";
import { Server } from "@hocuspocus/server";
import { applyUpdate, encodeStateAsUpdate } from "yjs";

import type { CollabTokenPayload } from "@acme/auth/collab-token";
import { verifyCollabToken } from "@acme/auth/collab-token";
import { and, db, room, roomMember, eq, sql } from "@acme/db";

import { env } from "./env.js";

interface CollabContext {
  user: {
    id: string;
    username: string;
  };
  roomId: number;
  role: CollabTokenPayload["role"];
  isReadOnly: boolean;
}

const allowedOrigins = (env.ALLOWED_WS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function originAllowed(origin: string | undefined): boolean {
  if (allowedOrigins.length === 0) return true;
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

const server = Server.configure({
  port: env.PORT,

  onListen: async (data) => {
    console.log(`Hocuspocus server running on port ${data.port}`);
  },

  onAuthenticate: async ({
    documentName,
    connection,
    token,
    requestHeaders,
  }) => {
    if (!originAllowed(requestHeaders.origin)) {
      throw new Error("Origin not allowed");
    }

    const expectedDuckletId = parseInt(
      documentName.replace("ducklet-", ""),
      10,
    );
    if (!Number.isFinite(expectedDuckletId)) {
      throw new Error("Invalid document name");
    }

    const payload = verifyCollabToken(
      token ?? "",
      process.env.BETTER_AUTH_SECRET ?? "",
    );
    if (!payload) {
      throw new Error("Invalid or expired token");
    }

    if (payload.roomId !== expectedDuckletId) {
      throw new Error("Token does not match document");
    }

    const [existingDucklet] = await db
      .select()
      .from(room)
      .where(eq(room.id, expectedDuckletId))
      .limit(1);

    if (!existingDucklet) {
      throw new Error("Ducklet not found");
    }

    // Re-verify access at connection time (token may have been issued
    // before access was revoked).
    let isReadOnly = true;
    if (existingDucklet.ownerId === payload.userId) {
      isReadOnly = false;
    } else {
      const [member] = await db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, expectedDuckletId),
            eq(roomMember.userId, payload.userId),
            eq(roomMember.status, "active"),
          ),
        )
        .limit(1);

      if (member?.role === "editor") {
        isReadOnly = false;
      } else if (member?.role === "viewer") {
        isReadOnly = true;
      } else if (existingDucklet.isPublic) {
        // Public room, non-member: read-only is allowed.
        isReadOnly = true;
      } else {
        throw new Error("Access denied");
      }
    }

    connection.readOnly = isReadOnly;

    const context: CollabContext = {
      user: {
        id: payload.userId,
        username: payload.username,
      },
      roomId: expectedDuckletId,
      role: payload.role,
      isReadOnly,
    };
    return context;
  },

  // Load existing document from PostgreSQL
  onLoadDocument: async ({ documentName, document }) => {
    const roomId = parseInt(documentName.replace("ducklet-", ""), 10);
    if (!Number.isFinite(roomId)) return;

    try {
      const [existing] = await db
        .select({ yjsData: room.yjsData })
        .from(room)
        .where(eq(room.id, roomId))
        .limit(1);

      if (existing?.yjsData) {
        const update = Buffer.from(existing.yjsData, "base64");
        applyUpdate(document, update);
      }
    } catch (err) {
      console.error("Failed to load document:", err);
    }

    return document;
  },

  // Enforce verified identity on awareness updates.
  // The client can still set color / cursor / photoURL freely, but the
  // server overwrites id and name with the values from the verified token
  // so a peer cannot impersonate someone else in the presence list.
  onAwarenessUpdate: async ({ awareness, updated, context }) => {
    const ctx = context as CollabContext | undefined;
    if (!ctx?.user) return;

    for (const clientId of updated) {
      const state = awareness.getStates().get(clientId);
      if (!state?.user) continue;

      const u = state.user as { id?: unknown; name?: unknown };
      if (u.id !== ctx.user.id || u.name !== ctx.user.username) {
        awareness.states.set(clientId, {
          ...state,
          user: {
            ...state.user,
            id: ctx.user.id,
            name: ctx.user.username,
          },
        });
      }
    }
  },

  // Store document to PostgreSQL
  onStoreDocument: async ({ documentName, document, clientsCount }) => {
    const roomId = parseInt(documentName.replace("ducklet-", ""), 10);
    if (!Number.isFinite(roomId)) return;

    try {
      const update = encodeStateAsUpdate(document);
      const data = Buffer.from(update).toString("base64");

      const [duckletData] = await db
        .select({
          id: room.id,
          ownerId: room.ownerId,
        })
        .from(room)
        .where(eq(room.id, roomId))
        .limit(1);

      if (!duckletData) {
        console.error(`Ducklet ${roomId} not found`);
        return;
      }

      await db
        .update(room)
        .set({
          yjsData: data,
          lastClientsCount: clientsCount,
          yjsVersion: sql`${room.yjsVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(room.id, roomId));

      // Chat is persisted via the `room.sendMessage` mutation, not here —
      // it intentionally no longer lives in the Y.Doc.
    } catch (err) {
      console.error("Failed to store document:", err);
    }
  },
});

server.listen();

const startedAt = Date.now();
const healthPort = env.PORT + 1;
const healthServer = createServer((req, res) => {
  if (req.url !== "/health" && req.url !== "/healthz") {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      status: "ok",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      documents: server.getDocumentsCount(),
      connections: server.getConnectionsCount(),
    }),
  );
});
healthServer.listen(healthPort, () => {
  console.log(`Healthcheck listening on port ${healthPort}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    await server.destroy();
    healthServer.close();
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

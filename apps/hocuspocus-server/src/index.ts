import { Server } from "@hocuspocus/server";
import { applyUpdate, encodeStateAsUpdate } from "yjs";

import { verifyCollabToken } from "@acme/auth/collab-token";
import type { CollabTokenPayload } from "@acme/auth/collab-token";
import {
  and,
  db,
  ducklet,
  duckletMember,
  duckletMessage,
  eq,
  sql,
} from "@acme/db";

import { env } from "./env.js";
import { generateAndStorePreview } from "./services/preview.js";

interface CollabContext {
  user: {
    id: string;
    username: string;
  };
  duckletId: number;
  role: CollabTokenPayload["role"];
  isReadOnly: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
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

    const expectedDuckletId = parseInt(documentName.replace("ducklet-", ""), 10);
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

    if (payload.duckletId !== expectedDuckletId) {
      throw new Error("Token does not match document");
    }

    const [existingDucklet] = await db
      .select()
      .from(ducklet)
      .where(eq(ducklet.id, expectedDuckletId))
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
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, expectedDuckletId),
            eq(duckletMember.userId, payload.userId),
            eq(duckletMember.status, "active"),
          ),
        )
        .limit(1);

      if (member?.role === "editor") {
        isReadOnly = false;
      } else if (member?.role === "viewer") {
        isReadOnly = true;
      } else if (existingDucklet.isPublic) {
        // Public ducklet, non-member: read-only is allowed.
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
      duckletId: expectedDuckletId,
      role: payload.role,
      isReadOnly,
    };
    return context;
  },

  // Load existing document from PostgreSQL
  onLoadDocument: async ({ documentName, document }) => {
    const duckletId = parseInt(documentName.replace("ducklet-", ""), 10);
    if (!Number.isFinite(duckletId)) return;

    try {
      const [existing] = await db
        .select({ yjsData: ducklet.yjsData })
        .from(ducklet)
        .where(eq(ducklet.id, duckletId))
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
    const duckletId = parseInt(documentName.replace("ducklet-", ""), 10);
    if (!Number.isFinite(duckletId)) return;

    try {
      const update = encodeStateAsUpdate(document);
      const data = Buffer.from(update).toString("base64");

      const [duckletData] = await db
        .select({
          id: ducklet.id,
          ownerId: ducklet.ownerId,
        })
        .from(ducklet)
        .where(eq(ducklet.id, duckletId))
        .limit(1);

      if (!duckletData) {
        console.error(`Ducklet ${duckletId} not found`);
        return;
      }

      await db
        .update(ducklet)
        .set({
          yjsData: data,
          lastClientsCount: clientsCount,
          yjsVersion: sql`${ducklet.yjsVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(ducklet.id, duckletId));

      // Persist chat messages. Only keep ones whose userId is either the
      // ducklet owner or an active member — this prevents a forged chat
      // message from being attributed to an arbitrary user in the DB.
      const messagesArray = document.getArray<ChatMessage>("messages");
      const messages = messagesArray.toArray();

      if (messages.length > 0) {
        const candidateUserIds = Array.from(
          new Set(messages.map((m) => m.userId).filter(Boolean)),
        );

        const allowedUserIds = new Set<string>();
        if (candidateUserIds.length > 0) {
          allowedUserIds.add(duckletData.ownerId);
          const members = await db
            .select({ userId: duckletMember.userId })
            .from(duckletMember)
            .where(
              and(
                eq(duckletMember.duckletId, duckletId),
                eq(duckletMember.status, "active"),
              ),
            );
          for (const m of members) allowedUserIds.add(m.userId);
        }

        const values = messages
          .filter(
            (msg) =>
              typeof msg.userId === "string" &&
              !msg.userId.startsWith("anon-") &&
              allowedUserIds.has(msg.userId) &&
              typeof msg.text === "string" &&
              msg.text.length > 0,
          )
          .map((msg) => ({
            id: msg.id,
            duckletId,
            userId: msg.userId,
            content: msg.text.slice(0, 4000),
            createdAt: new Date(msg.timestamp),
          }));

        if (values.length > 0) {
          await db.insert(duckletMessage).values(values).onConflictDoNothing();
        }
      }

      // Preview generation runs out-of-band; failures are swallowed inside
      // generateAndStorePreview itself.
      const html = document.getText("html").toString();
      const css = document.getText("css").toString();
      const js = document.getText("js").toString();
      const settingsMap = document.getMap("settings");
      const headScripts = (settingsMap.get("headScripts") as string) ?? "";

      void generateAndStorePreview({
        duckletId,
        html,
        css,
        js,
        headScripts,
      });
    } catch (err) {
      console.error("Failed to store document:", err);
    }
  },
});

server.listen();

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    await server.destroy();
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

import { Server } from "@hocuspocus/server";
import { applyUpdate, encodeStateAsUpdate } from "yjs";

import {
  and,
  db,
  ducklet,
  duckletMember,
  duckletMessage,
  eq,
  sql,
} from "@acme/db";

import { generateAndStorePreview } from "./services/preview.js";

console.log("hi");

const PORT = parseInt(process.env.PORT || "5000", 10);

const server = Server.configure({
  port: PORT,
  onListen: async (data) => {
    console.log(`Hocuspocus server running on port ${data.port}`);
  },

  onAuthenticate: async ({
    documentName,
    connection,
    token,
    requestParameters,
  }) => {
    // documentName here corresponds to ducklet-id
    const duckletId = parseInt(documentName.replace("ducklet-", ""));
    const userId = requestParameters.get("userId") || token;
    try {
      if (!userId || typeof userId !== "string") {
        // Anonymous or Malformed
        // If ducklet is public -> Read Only
        // If ducklet is private -> Kick
      }

      console.log(`Authenticating duckletId: ${duckletId}, userId: ${userId}`);

      // Check Ducklet Accessibility
      const [existingDucklet] = await db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, duckletId))
        .limit(1);

      if (!existingDucklet) {
        throw new Error("Ducklet not found");
      }

      // Determine permissions
      let isReadOnly = true;

      if (userId && typeof userId === "string" && !userId.startsWith("anon-")) {
        // Check Membership
        const [member] = await db
          .select()
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, duckletId),
              eq(duckletMember.userId, userId),
            ),
          )
          .limit(1);

        if (
          member?.status === "active" &&
          (member.role === "editor" || member.role === "owner")
        ) {
          isReadOnly = false;
        }

        // Owner Check (if not in member table for some reason, though schema enforces it usually)
        if (existingDucklet.ownerId === userId) {
          isReadOnly = false;
        }
      }

      if (!existingDucklet.isPublic && isReadOnly) {
        // Private and no write access? Check if they have at least read access (viewer active)
        const [member] = await db
          .select()
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, duckletId),
              eq(duckletMember.userId, userId as string),
            ),
          )
          .limit(1);

        if (!member || member.status !== "active") {
          // Not a member of private ducklet -> Reject
          // Unless we want to allow guests to REQUEST access via socket?
          // Better to block connection and let them request via API.
          throw new Error("Access denied");
        }
      }

      // Set connection state
      connection.readOnly = isReadOnly;
    } catch (err) {
      console.log("on auth error", err);
    }
  },

  // Load existing document from PostgreSQL
  onLoadDocument: async ({ documentName, document }) => {
    // documentName here corresponds to ducklet-id
    const duckletId = parseInt(documentName.replace("ducklet-", ""));
    if (isNaN(duckletId)) return;

    try {
      const [existing] = await db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, duckletId))
        .limit(1);

      if (existing?.yjsData) {
        const update = Buffer.from(existing.yjsData, "base64");
        applyUpdate(document, update);
        console.log(`Loaded document: ${documentName}`);
      } else {
        console.log(`New document session: ${documentName}`);
      }
    } catch (err) {
      console.error("Failed to load document:", err);
    }

    return document;
  },

  // Store document to PostgreSQL
  onStoreDocument: async ({ documentName, document, clientsCount, context }) => {
    // documentName here corresponds to ducklet-id
    const duckletId = parseInt(documentName.replace("ducklet-", ""));
    if (isNaN(duckletId)) return;

    try {
      const update = encodeStateAsUpdate(document);
      const data = Buffer.from(update).toString("base64");

      // Fetch ducklet data for both saving and access check
      const [duckletData] = await db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, duckletId))
        .limit(1);

      if (!duckletData) {
        console.error(`Ducklet ${duckletId} not found`);
        return;
      }

      // Update ducklet with new data
      await db
        .update(ducklet)
        .set({
          yjsData: data,
          lastClientsCount: clientsCount,
          yjsVersion: sql`${ducklet.yjsVersion} + 1`,
        })
        .where(eq(ducklet.id, duckletId));

      // Extract and save messages
      const messagesArray = document.getArray("messages");
      const messages = messagesArray.toArray() as any[];

      if (messages.length > 0) {
        const values = messages
          .filter((msg) => !msg.userId.startsWith("anon-"))
          .map((msg) => ({
            id: msg.id,
            duckletId: duckletId,
            userId: msg.userId,
            content: msg.text,
            createdAt: new Date(msg.timestamp),
          }));

        if (values.length > 0) {
          // Bulk insert new messages, ignoring duplicates
          await db.insert(duckletMessage).values(values).onConflictDoNothing();
        }
      }

      console.log(
        `Stored document: ${documentName} (${messages.length} messages)`,
      );

      // Generate and store preview image
      const html = document.getText("html").toString() || "";
      const css = document.getText("css").toString() || "";
      const js = document.getText("js").toString() || "";

      // Extract head scripts (libraries, tailwind, etc.)
      const settingsMap = document.getMap("settings");
      const headScripts = (settingsMap.get("headScripts") as string) || "";

      void generateAndStorePreview({
        duckletId,
        html,
        css,
        js,
        headScripts,
      });

      // Check user access and disconnect revoked users
      // This runs on document save (debounced naturally by Hocuspocus)
      const connections = context.getConnections();

      for (const connection of connections) {
        const userId = connection.request.parameters.get("userId");
        if (!userId || typeof userId !== "string") continue;

        // Skip owner check
        if (userId === duckletData.ownerId) continue;

        // Check if user still has access
        const [member] = await db
          .select()
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, duckletId),
              eq(duckletMember.userId, userId),
            ),
          )
          .limit(1);

        // If no active membership, disconnect them
        if (!member || member.status !== "active") {
          console.log(
            `[Access Revoked] Disconnecting user ${userId} from ducklet ${duckletId}`,
          );
          connection.close();
        }
      }
    } catch (err) {
      console.error("Failed to store document:", err);
    }
  },
});

server.listen();

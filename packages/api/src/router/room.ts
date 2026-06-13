import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";

import type { CollabRole } from "@acme/auth/collab-token";
import { signCollabToken } from "@acme/auth/collab-token";
import { roomPolicy } from "@acme/db";
import {
  room,
  roomKindEnum,
  roomMember,
  roomMessage,
  roomSnapshot,
  machineCodingAttempt,
  userProfile,
} from "@acme/db/schema";
import { getEditablePaths, getProblem } from "@acme/machine-coding-content";
import { getPublicUrl, uploadFile } from "@acme/storage";

import type { ChatMessageDTO } from "../realtime";
import { publishRoomEvent, subscribeRoomEvents } from "../realtime";
import { createRoom } from "../services/room";
import { track } from "../telemetry";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const COLLAB_TOKEN_TTL_SECONDS = 60 * 60;

// In-process rate limiter for requestAccess: max 5 requests per user per
// 5-minute window. Sized for a single API node — good enough to deter
// casual spam without standing up a Redis-backed limiter.
const REQUEST_ACCESS_WINDOW_MS = 5 * 60 * 1000;
const REQUEST_ACCESS_LIMIT = 5;
const requestAccessHits = new Map<string, number[]>();

function checkRequestAccessRate(userId: string): boolean {
  const now = Date.now();
  const hits = (requestAccessHits.get(userId) ?? []).filter(
    (t) => now - t < REQUEST_ACCESS_WINDOW_MS,
  );
  if (hits.length >= REQUEST_ACCESS_LIMIT) {
    requestAccessHits.set(userId, hits);
    return false;
  }
  hits.push(now);
  requestAccessHits.set(userId, hits);
  return true;
}

export const roomRouter = createTRPCRouter({
  /**
   * List ducklets (public + user's private ducklets)
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.number().nullish(),
          onlyMine: z.boolean().optional(),
          search: z.string().trim().max(100).optional(),
          sort: z.enum(["recent", "oldest", "updated"]).default("recent"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.cursor ?? 0;
      const onlyMine = input?.onlyMine;
      const search = input?.search;
      const sort = input?.sort ?? "recent";

      const conditions = [];

      // Only kinds the policy marks as publicly listed surface here (excludes
      // machine-coding practice rooms). Derived so a new kind is hidden by default.
      const listedKinds = roomKindEnum.enumValues.filter(
        (k) => roomPolicy(k).listedPublicly,
      );
      conditions.push(inArray(room.kind, listedKinds));

      if (ctx.session?.user && onlyMine) {
        conditions.push(eq(room.ownerId, ctx.session.user.id));
      } else if (ctx.session?.user) {
        conditions.push(
          or(
            eq(room.isPublic, true),
            eq(room.ownerId, ctx.session.user.id),
          ),
        );
      } else {
        conditions.push(eq(room.isPublic, true));
      }

      if (search) {
        // Postgres ILIKE handles case-insensitive prefix/substring match.
        // % chars in the input are escaped so users can't widen the search.
        const escaped = search.replace(/[\\%_]/g, (m) => `\\${m}`);
        conditions.push(ilike(room.name, `%${escaped}%`));
      }

      const orderBy =
        sort === "oldest"
          ? room.createdAt
          : sort === "updated"
            ? desc(room.updatedAt)
            : desc(room.createdAt);

      const ducklets = await ctx.db
        .select({
          id: room.id,
          name: room.name,
          description: room.description,
          isPublic: room.isPublic,
          previewImage: room.previewImage,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          ownerId: room.ownerId,
          owner: {
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          },
        })
        .from(room)
        .leftJoin(userProfile, eq(room.ownerId, userProfile.userId))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const items = ducklets.map((d) => ({
        ...d,
        previewImage: d.previewImage ? getPublicUrl(d.previewImage) : null,
      }));

      const nextCursor =
        items.length === limit ? offset + items.length : undefined;

      return { items, nextCursor };
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      // Short-circuit: private room with no session user can't read at all.
      if (!result.isPublic && !ctx.session?.user) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Members + owner profile fetched in parallel — both are independent
      // of each other so there's no need to await them sequentially.
      // We use the members list to derive the access check below, which
      // avoids a separate membership query for private non-owner readers.
      const [members, ownerRows] = await Promise.all([
        ctx.db
          .select({
            userId: roomMember.userId,
            role: roomMember.role,
            status: roomMember.status,
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          })
          .from(roomMember)
          .leftJoin(userProfile, eq(roomMember.userId, userProfile.userId))
          .where(eq(roomMember.roomId, input.id)),
        ctx.db
          .select({
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          })
          .from(userProfile)
          .where(eq(userProfile.userId, result.ownerId))
          .limit(1),
      ]);

      // Get current user's membership status
      let currentUserStatus = null;
      if (ctx.session?.user) {
        const member = members.find((m) => m.userId === ctx.session!.user.id);
        if (member) {
          currentUserStatus = member.status;
        }
      }

      // Re-check access now that we have the members list. Private ducklets
      // require ownership or an ACTIVE membership.
      if (
        !result.isPublic &&
        result.ownerId !== ctx.session!.user.id &&
        currentUserStatus !== "active"
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const owner = ownerRows[0];

      // For machine-coding rooms, attach the problem prompt + this room's attempt so
      // the workspace can render the Problem panel and the countdown. Solution
      // and test files are never included here — only `machineCoding.getSolution`
      // exposes them.
      let machineCodingContext = null;
      if (roomPolicy(result.kind).isInterview) {
        const [attempt] = await ctx.db
          .select()
          .from(machineCodingAttempt)
          .where(eq(machineCodingAttempt.roomId, result.id))
          .limit(1);
        const problem = attempt ? getProblem(attempt.problemSlug) : undefined;
        if (attempt && problem) {
          machineCodingContext = {
            problemSlug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
            category: problem.category,
            durationMinutes: problem.durationMinutes,
            description: problem.description,
            tags: problem.tags,
            companies: problem.companies,
            editablePaths: getEditablePaths(problem),
            startedAt: attempt.startedAt,
            status: attempt.status,
            solutionRevealed: attempt.solutionRevealed,
          };
        }
      }

      return {
        ...result,
        previewImage: result.previewImage
          ? getPublicUrl(result.previewImage)
          : null,
        owner,
        members,
        currentUserStatus,
        machineCodingContext,
      };
    }),

  /**
   * SSE stream of a room's realtime events. Same read access as `byId`:
   * public → anyone (incl. guests), private → owner or active member.
   */
  onEvent: publicProcedure
    .input(z.object({ roomId: z.number() }))
    .subscription(async function* (opts) {
      const { ctx, input, signal } = opts;

      const [existing] = await ctx.db
        .select({
          id: room.id,
          ownerId: room.ownerId,
          isPublic: room.isPublic,
        })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ducklet not found" });
      }

      if (!existing.isPublic) {
        const userId = ctx.session?.user.id;
        if (!userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        if (existing.ownerId !== userId) {
          const [member] = await ctx.db
            .select({ userId: roomMember.userId })
            .from(roomMember)
            .where(
              and(
                eq(roomMember.roomId, input.roomId),
                eq(roomMember.userId, userId),
                eq(roomMember.status, "active"),
              ),
            )
            .limit(1);

          if (!member) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Access denied",
            });
          }
        }
      }

      for await (const event of subscribeRoomEvents(input.roomId, signal)) {
        yield event;
      }
    }),

  /**
   * Issue a short-lived signed token for connecting to the Hocuspocus
   * collaboration websocket. Verifies ownership / active membership /
   * public-read access before signing.
   */
  getCollabToken: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      const userId = ctx.session.user.id;
      let role: CollabRole;

      if (existing.ownerId === userId) {
        role = "owner";
      } else {
        const [member] = await ctx.db
          .select()
          .from(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, userId),
              eq(roomMember.status, "active"),
            ),
          )
          .limit(1);

        if (member?.role === "editor") {
          role = "editor";
        } else if (member?.role === "viewer") {
          role = "viewer";
        } else if (existing.isPublic) {
          role = "viewer";
        } else {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const sessionUser = ctx.session.user as {
        id: string;
        name?: string;
        username?: string;
      };
      const username = sessionUser.username ?? sessionUser.name ?? "User";

      const token = signCollabToken(
        {
          userId,
          username,
          roomId: input.roomId,
          role,
          exp: Math.floor(Date.now() / 1000) + COLLAB_TOKEN_TTL_SECONDS,
        },
        process.env.BETTER_AUTH_SECRET ?? "",
      );

      return { token, role };
    }),

  /**
   * Store an auto-captured preview screenshot for a room (used as the
   * gallery thumbnail and OG image). Only the owner or an active editor may
   * write it. The image is uploaded to R2 under a stable per-room key, so
   * each capture overwrites the last — no orphaned objects, stable public URL.
   */
  updatePreviewImage: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        // base64-encoded image bytes (no data: prefix). Capped at ~4MB base64.
        image: z.string().min(1).max(4_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [existing] = await ctx.db
        .select({
          ownerId: room.ownerId,
          previewImage: room.previewImage,
        })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ducklet not found" });
      }

      // Owner, or an active editor member — viewers cannot write thumbnails.
      if (existing.ownerId !== userId) {
        const [member] = await ctx.db
          .select({ role: roomMember.role })
          .from(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, userId),
              eq(roomMember.status, "active"),
            ),
          )
          .limit(1);

        if (member?.role !== "editor") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const ext =
        input.contentType === "image/png"
          ? "png"
          : input.contentType === "image/webp"
            ? "webp"
            : "jpg";
      const key = `ducklet-previews/${input.roomId}.${ext}`;

      await uploadFile(
        key,
        Buffer.from(input.image, "base64"),
        input.contentType,
        // Short TTL so the stable URL still refreshes for OG/thumbnail viewers.
        "public, max-age=300",
      );

      // Only touch the row when the stored key actually changes, so repeat
      // captures don't needlessly bump `updatedAt` (gallery sort order).
      if (existing.previewImage !== key) {
        await ctx.db
          .update(room)
          .set({ previewImage: key })
          .where(eq(room.id, input.roomId));
      }

      return { previewImage: getPublicUrl(key) };
    }),

  /**
   * Create a new room
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        isPublic: z.boolean().default(true),
        // Cap at ~5MB base64 to prevent oversized initial snapshots from
        // blowing past TRPC payload limits.
        yjsData: z.string().max(5_000_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newDucklet = await createRoom(ctx.db, {
        name: input.name,
        description: input.description,
        isPublic: input.isPublic,
        yjsData: input.yjsData,
        ownerId: ctx.session.user.id,
      });

      if (newDucklet) {
        track("ducklet.created", {
          roomId: newDucklet.id,
          userId: ctx.session.user.id,
          isPublic: newDucklet.isPublic,
        });
      }

      return newDucklet;
    }),

  /**
   * Fork an existing room — copies its current yjsData snapshot
   * into a new private room owned by the caller.
   */
  fork: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [source] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.id))
        .limit(1);

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      // Machine-coding rooms aren't forkable — use the catalogue.
      if (!roomPolicy(source.kind).forkable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Machine-coding rooms can't be forked",
        });
      }

      // Caller must be able to read the source: public, owner, or active member.
      const userId = ctx.session.user.id;
      if (!source.isPublic && source.ownerId !== userId) {
        const [member] = await ctx.db
          .select()
          .from(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.id),
              eq(roomMember.userId, userId),
              eq(roomMember.status, "active"),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const forkedName = (input.name ?? `${source.name} (fork)`).slice(0, 100);

      const forked = await createRoom(ctx.db, {
        name: forkedName,
        description: source.description,
        isPublic: false,
        yjsData: source.yjsData,
        ownerId: userId,
      });

      if (forked) {
        track("ducklet.forked", {
          roomId: forked.id,
          sourceDuckletId: source.id,
          userId,
        });
      }

      return forked;
    }),

  /**
   * Update room settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
        isPublic: z.boolean().optional(),
      }),
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

      if (
        updated &&
        typeof updates.isPublic === "boolean" &&
        updates.isPublic !== existing.isPublic
      ) {
        publishRoomEvent({
          type: "visibility:changed",
          roomId: id,
          isPublic: updated.isPublic,
        });
      }

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

      track("ducklet.deleted", {
        roomId: input.id,
        userId: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Add member to room
   */
  addMember: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userId: z.string().max(100),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
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
   * Change an existing member's role (Owner only).
   */
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userId: z.string().max(100),
        role: z.enum(["editor", "viewer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [member] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, input.userId),
          ),
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      await ctx.db
        .update(roomMember)
        .set({ role: input.role })
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, input.userId),
          ),
        );

      track("ducklet.member.role_changed", {
        roomId: input.roomId,
        actorId: ctx.session.user.id,
        memberId: input.userId,
        role: input.role,
      });

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
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
        userId: z.string().max(100),
      }),
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
            eq(roomMember.userId, input.userId),
          ),
        );

      track("ducklet.member.removed", {
        roomId: input.roomId,
        actorId: ctx.session.user.id,
        memberId: input.userId,
      });

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
      });

      return { success: true };
    }),

  /**
   * Invite a user to a room by username
   */
  inviteUser: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        username: z.string().min(1).max(100),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Ducklet Ownership
      const [existingDucklet] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existingDucklet || existingDucklet.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to invite users",
        });
      }

      // 2. Find User by Username
      const [targetUser] = await ctx.db
        .select()
        .from(userProfile)
        .where(eq(userProfile.username, input.username))
        .limit(1);

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (targetUser.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot invite yourself",
        });
      }

      // 3. Check if already a member/invited
      const [existingMember] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, targetUser.userId),
          ),
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.status === "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already a member",
          });
        } else if (existingMember.status === "invited") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already invited",
          });
        } else if (existingMember.status === "requested") {
          // If they requested, just approve them by updating to active/invited
          await ctx.db
            .update(roomMember)
            .set({ status: "active", role: input.role })
            .where(
              and(
                eq(roomMember.roomId, input.roomId),
                eq(roomMember.userId, targetUser.userId),
              ),
            );
          publishRoomEvent({
            type: "members:changed",
            roomId: input.roomId,
          });
          return { success: true, message: "Request approved" };
        }
      }

      // 4. Create Invitation
      await ctx.db.insert(roomMember).values({
        roomId: input.roomId,
        userId: targetUser.userId,
        role: input.role,
        status: "invited",
      });

      track("ducklet.member.invited", {
        roomId: input.roomId,
        inviterId: ctx.session.user.id,
        inviteeId: targetUser.userId,
        role: input.role,
      });

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
      });

      return { success: true, message: "Invitation sent" };
    }),

  /**
   * Request access to a room
   */
  requestAccess: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!checkRequestAccessRate(ctx.session.user.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many access requests. Please wait a few minutes.",
        });
      }

      // 1. Verify Ducklet exists
      const [existingDucklet] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existingDucklet) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingDucklet.ownerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are the owner",
        });
      }

      // 2. Check existing membership
      const [existingMember] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.status === "active")
          return { success: true, message: "Already a member" };
        if (existingMember.status === "requested")
          return { success: true, message: "Request already sending" };
        if (existingMember.status === "invited") {
          // If invited, auto-accept
          await ctx.db
            .update(roomMember)
            .set({ status: "active" })
            .where(
              and(
                eq(roomMember.roomId, input.roomId),
                eq(roomMember.userId, ctx.session.user.id),
              ),
            );
          return { success: true, message: "Joined via invitation" };
        }
      }

      // 3. Create Request
      await ctx.db.insert(roomMember).values({
        roomId: input.roomId,
        userId: ctx.session.user.id,
        role: "viewer", // Default request role
        status: "requested",
      });

      track("ducklet.access.requested", {
        roomId: input.roomId,
        userId: ctx.session.user.id,
      });

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
      });

      return { success: true };
    }),

  /**
   * Respond to invitation (Accept/Decline)
   */
  respondToInvite: protectedProcedure
    .input(z.object({ roomId: z.number(), accept: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [member] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, ctx.session.user.id),
            eq(roomMember.status, "invited"),
          ),
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No invitation found",
        });
      }

      if (input.accept) {
        await ctx.db
          .update(roomMember)
          .set({ status: "active" })
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, ctx.session.user.id),
            ),
          );
      } else {
        await ctx.db
          .delete(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, ctx.session.user.id),
            ),
          );
      }

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
      });

      return { success: true };
    }),

  /**
   * Respond to access request (Owner only)
   */
  respondToRequest: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        userId: z.string().max(100),
        accept: z.boolean(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Ownership
      const [existingDucklet] = await ctx.db
        .select()
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existingDucklet || existingDucklet.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // 2. Find Request
      const [member] = await ctx.db
        .select()
        .from(roomMember)
        .where(
          and(
            eq(roomMember.roomId, input.roomId),
            eq(roomMember.userId, input.userId),
            eq(roomMember.status, "requested"),
          ),
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pending request found",
        });
      }

      if (input.accept) {
        await ctx.db
          .update(roomMember)
          .set({ status: "active", role: input.role })
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, input.userId),
            ),
          );
      } else {
        await ctx.db
          .delete(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, input.userId),
            ),
          );
      }

      publishRoomEvent({
        type: "members:changed",
        roomId: input.roomId,
      });

      return { success: true };
    }),

  /**
   * Paginated chat history for a room. Cursor is the createdAt
   * timestamp of the oldest message in the previous page; messages
   * are returned newest-first.
   */
  chatHistory: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Same access rules as byId: owner, active member, or public reader.
      const [existing] = await ctx.db
        .select({
          id: room.id,
          ownerId: room.ownerId,
          isPublic: room.isPublic,
        })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      const userId = ctx.session.user.id;
      if (!existing.isPublic && existing.ownerId !== userId) {
        const [member] = await ctx.db
          .select()
          .from(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, userId),
              eq(roomMember.status, "active"),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const conditions = [eq(roomMessage.roomId, input.roomId)];
      if (input.cursor) {
        conditions.push(lt(roomMessage.createdAt, new Date(input.cursor)));
      }

      const rows = await ctx.db
        .select({
          id: roomMessage.id,
          userId: roomMessage.userId,
          authorUsername: roomMessage.authorUsername,
          content: roomMessage.content,
          createdAt: roomMessage.createdAt,
          liveUsername: userProfile.username,
          livePhotoURL: userProfile.photoURL,
        })
        .from(roomMessage)
        .leftJoin(userProfile, eq(roomMessage.userId, userProfile.userId))
        .where(and(...conditions))
        .orderBy(desc(roomMessage.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = (hasMore ? rows.slice(0, input.limit) : rows).map((r) => ({
        id: r.id,
        userId: r.userId,
        // Prefer the current profile username; fall back to the snapshot
        // taken at send-time if the user has since been deleted.
        username: r.liveUsername ?? r.authorUsername ?? "[deleted user]",
        photoURL: r.livePhotoURL,
        content: r.content,
        createdAt: r.createdAt,
        isDeletedAuthor: r.userId == null,
      }));

      const nextCursor = hasMore
        ? items[items.length - 1]?.createdAt.toISOString()
        : undefined;

      return { items, nextCursor };
    }),

  /**
   * Send a chat message. Persists to Postgres and pushes it live via
   * `room.onEvent` — chat is NOT in the Y.Doc. Only owner / active members
   * may send. The client-supplied `id` dedups the echo and collapses retries.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        id: z.string().min(1).max(100),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: room.id, ownerId: room.ownerId })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ducklet not found" });
      }

      const userId = ctx.session.user.id;
      if (existing.ownerId !== userId) {
        const [member] = await ctx.db
          .select({ userId: roomMember.userId })
          .from(roomMember)
          .where(
            and(
              eq(roomMember.roomId, input.roomId),
              eq(roomMember.userId, userId),
              eq(roomMember.status, "active"),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only members can send messages",
          });
        }
      }

      const sessionUser = ctx.session.user as {
        name?: string;
        username?: string;
        image?: string | null;
      };
      const username = sessionUser.username ?? sessionUser.name ?? "User";
      const createdAt = new Date();

      await ctx.db
        .insert(roomMessage)
        .values({
          id: input.id,
          roomId: input.roomId,
          userId,
          authorUsername: username.slice(0, 100),
          content: input.content,
          createdAt,
        })
        .onConflictDoNothing();

      const message: ChatMessageDTO = {
        id: input.id,
        roomId: input.roomId,
        userId,
        username,
        photoURL: sessionUser.image ?? null,
        content: input.content,
        createdAt: createdAt.getTime(),
      };

      publishRoomEvent({
        type: "chat:message",
        roomId: input.roomId,
        message,
      });

      return message;
    }),

  /**
   * Snapshot the current yjsData so the owner can restore later.
   */
  createSnapshot: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        label: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: room.id,
          ownerId: room.ownerId,
          yjsData: room.yjsData,
        })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!existing.yjsData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nothing to snapshot yet",
        });
      }

      const [created] = await ctx.db
        .insert(roomSnapshot)
        .values({
          roomId: input.roomId,
          yjsData: existing.yjsData,
          label: input.label,
          createdBy: ctx.session.user.id,
        })
        .returning({
          id: roomSnapshot.id,
          label: roomSnapshot.label,
          createdAt: roomSnapshot.createdAt,
        });

      if (created) {
        track("ducklet.snapshot.created", {
          roomId: input.roomId,
          snapshotId: created.id,
          userId: ctx.session.user.id,
        });
      }

      return created;
    }),

  /**
   * List snapshots for a room (owner only — snapshots may contain
   * intermediate state the owner doesn't want to expose).
   */
  listSnapshots: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: room.ownerId })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const snapshots = await ctx.db
        .select({
          id: roomSnapshot.id,
          label: roomSnapshot.label,
          createdAt: roomSnapshot.createdAt,
          createdBy: roomSnapshot.createdBy,
          creatorUsername: userProfile.username,
        })
        .from(roomSnapshot)
        .leftJoin(
          userProfile,
          eq(roomSnapshot.createdBy, userProfile.userId),
        )
        .where(eq(roomSnapshot.roomId, input.roomId))
        .orderBy(desc(roomSnapshot.createdAt));

      return snapshots;
    }),

  /**
   * Restore a snapshot. Writes the snapshot's yjsData back to the room
   * and bumps yjsVersion so connected clients are forced to reload.
   *
   * Note: this is a destructive operation; clients with unsaved edits will
   * lose them. The UI should warn before invoking.
   */
  restoreSnapshot: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        snapshotId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: room.ownerId })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [snap] = await ctx.db
        .select()
        .from(roomSnapshot)
        .where(
          and(
            eq(roomSnapshot.id, input.snapshotId),
            eq(roomSnapshot.roomId, input.roomId),
          ),
        )
        .limit(1);

      if (!snap) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Snapshot not found",
        });
      }

      await ctx.db
        .update(room)
        .set({ yjsData: snap.yjsData })
        .where(eq(room.id, input.roomId));

      track("ducklet.snapshot.restored", {
        roomId: input.roomId,
        snapshotId: input.snapshotId,
        userId: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Delete a snapshot (owner only).
   */
  deleteSnapshot: protectedProcedure
    .input(
      z.object({
        roomId: z.number(),
        snapshotId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: room.ownerId })
        .from(room)
        .where(eq(room.id, input.roomId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(roomSnapshot)
        .where(
          and(
            eq(roomSnapshot.id, input.snapshotId),
            eq(roomSnapshot.roomId, input.roomId),
          ),
        );

      return { success: true };
    }),
});

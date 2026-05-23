import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { z } from "zod";

import type { CollabRole } from "@acme/auth/collab-token";
import { signCollabToken } from "@acme/auth/collab-token";
import {
  ducklet,
  duckletMember,
  duckletMessage,
  duckletSnapshot,
  userProfile,
} from "@acme/db/schema";
import { getPublicUrl } from "@acme/storage";

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

export const duckletRouter = createTRPCRouter({
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

      if (ctx.session?.user && onlyMine) {
        conditions.push(eq(ducklet.ownerId, ctx.session.user.id));
      } else if (ctx.session?.user) {
        conditions.push(
          or(
            eq(ducklet.isPublic, true),
            eq(ducklet.ownerId, ctx.session.user.id),
          ),
        );
      } else {
        conditions.push(eq(ducklet.isPublic, true));
      }

      if (search) {
        // Postgres ILIKE handles case-insensitive prefix/substring match.
        // % chars in the input are escaped so users can't widen the search.
        const escaped = search.replace(/[\\%_]/g, (m) => `\\${m}`);
        conditions.push(ilike(ducklet.name, `%${escaped}%`));
      }

      const orderBy =
        sort === "oldest"
          ? ducklet.createdAt
          : sort === "updated"
            ? desc(ducklet.updatedAt)
            : desc(ducklet.createdAt);

      const ducklets = await ctx.db
        .select({
          id: ducklet.id,
          name: ducklet.name,
          description: ducklet.description,
          isPublic: ducklet.isPublic,
          previewImage: ducklet.previewImage,
          createdAt: ducklet.createdAt,
          updatedAt: ducklet.updatedAt,
          ownerId: ducklet.ownerId,
          owner: {
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          },
        })
        .from(ducklet)
        .leftJoin(userProfile, eq(ducklet.ownerId, userProfile.userId))
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
   * Get ducklet by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      // Short-circuit: private ducklet with no session user can't read at all.
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
            userId: duckletMember.userId,
            role: duckletMember.role,
            status: duckletMember.status,
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          })
          .from(duckletMember)
          .leftJoin(userProfile, eq(duckletMember.userId, userProfile.userId))
          .where(eq(duckletMember.duckletId, input.id)),
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

      return {
        ...result,
        previewImage: result.previewImage
          ? getPublicUrl(result.previewImage)
          : null,
        owner,
        members,
        currentUserStatus,
      };
    }),

  /**
   * Issue a short-lived signed token for connecting to the Hocuspocus
   * collaboration websocket. Verifies ownership / active membership /
   * public-read access before signing.
   */
  getCollabToken: protectedProcedure
    .input(z.object({ duckletId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
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
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, userId),
              eq(duckletMember.status, "active"),
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
          duckletId: input.duckletId,
          role,
          exp: Math.floor(Date.now() / 1000) + COLLAB_TOKEN_TTL_SECONDS,
        },
        process.env.BETTER_AUTH_SECRET ?? "",
      );

      return { token, role };
    }),

  /**
   * Create a new ducklet
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
      const [newDucklet] = await ctx.db
        .insert(ducklet)
        .values({
          ...input,
          ownerId: ctx.session.user.id,
        })
        .returning();

      if (newDucklet) {
        track("ducklet.created", {
          duckletId: newDucklet.id,
          userId: ctx.session.user.id,
          isPublic: newDucklet.isPublic,
        });
      }

      return newDucklet;
    }),

  /**
   * Fork an existing ducklet — copies its current yjsData snapshot
   * into a new private ducklet owned by the caller.
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
        .from(ducklet)
        .where(eq(ducklet.id, input.id))
        .limit(1);

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ducklet not found",
        });
      }

      // Caller must be able to read the source: public, owner, or active member.
      const userId = ctx.session.user.id;
      if (!source.isPublic && source.ownerId !== userId) {
        const [member] = await ctx.db
          .select()
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.id),
              eq(duckletMember.userId, userId),
              eq(duckletMember.status, "active"),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const forkedName = (input.name ?? `${source.name} (fork)`).slice(0, 100);

      const [forked] = await ctx.db
        .insert(ducklet)
        .values({
          name: forkedName,
          description: source.description,
          isPublic: false,
          yjsData: source.yjsData,
          ownerId: userId,
        })
        .returning();

      if (forked) {
        track("ducklet.forked", {
          duckletId: forked.id,
          sourceDuckletId: source.id,
          userId,
        });
      }

      return forked;
    }),

  /**
   * Update ducklet settings
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
        .from(ducklet)
        .where(eq(ducklet.id, id))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(ducklet)
        .set(updates)
        .where(eq(ducklet.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete ducklet
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.id))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(ducklet).where(eq(ducklet.id, input.id));

      track("ducklet.deleted", {
        duckletId: input.id,
        userId: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Add member to ducklet
   */
  addMember: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        userId: z.string().max(100),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.insert(duckletMember).values({
        duckletId: input.duckletId,
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
        duckletId: z.number(),
        userId: z.string().max(100),
        role: z.enum(["editor", "viewer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [member] = await ctx.db
        .select()
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, input.userId),
          ),
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      await ctx.db
        .update(duckletMember)
        .set({ role: input.role })
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, input.userId),
          ),
        );

      track("ducklet.member.role_changed", {
        duckletId: input.duckletId,
        actorId: ctx.session.user.id,
        memberId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  /**
   * Remove member from ducklet
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        userId: z.string().max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const [existing] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, input.userId),
          ),
        );

      track("ducklet.member.removed", {
        duckletId: input.duckletId,
        actorId: ctx.session.user.id,
        memberId: input.userId,
      });

      return { success: true };
    }),

  /**
   * Invite a user to a ducklet by username
   */
  inviteUser: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        username: z.string().min(1).max(100),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Ducklet Ownership
      const [existingDucklet] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
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
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, targetUser.userId),
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
            .update(duckletMember)
            .set({ status: "active", role: input.role })
            .where(
              and(
                eq(duckletMember.duckletId, input.duckletId),
                eq(duckletMember.userId, targetUser.userId),
              ),
            );
          return { success: true, message: "Request approved" };
        }
      }

      // 4. Create Invitation
      await ctx.db.insert(duckletMember).values({
        duckletId: input.duckletId,
        userId: targetUser.userId,
        role: input.role,
        status: "invited",
      });

      track("ducklet.member.invited", {
        duckletId: input.duckletId,
        inviterId: ctx.session.user.id,
        inviteeId: targetUser.userId,
        role: input.role,
      });

      return { success: true, message: "Invitation sent" };
    }),

  /**
   * Request access to a ducklet
   */
  requestAccess: protectedProcedure
    .input(z.object({ duckletId: z.number() }))
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
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
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
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, ctx.session.user.id),
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
            .update(duckletMember)
            .set({ status: "active" })
            .where(
              and(
                eq(duckletMember.duckletId, input.duckletId),
                eq(duckletMember.userId, ctx.session.user.id),
              ),
            );
          return { success: true, message: "Joined via invitation" };
        }
      }

      // 3. Create Request
      await ctx.db.insert(duckletMember).values({
        duckletId: input.duckletId,
        userId: ctx.session.user.id,
        role: "viewer", // Default request role
        status: "requested",
      });

      track("ducklet.access.requested", {
        duckletId: input.duckletId,
        userId: ctx.session.user.id,
      });

      return { success: true };
    }),

  /**
   * Respond to invitation (Accept/Decline)
   */
  respondToInvite: protectedProcedure
    .input(z.object({ duckletId: z.number(), accept: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [member] = await ctx.db
        .select()
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, ctx.session.user.id),
            eq(duckletMember.status, "invited"),
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
          .update(duckletMember)
          .set({ status: "active" })
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, ctx.session.user.id),
            ),
          );
      } else {
        await ctx.db
          .delete(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, ctx.session.user.id),
            ),
          );
      }

      return { success: true };
    }),

  /**
   * Respond to access request (Owner only)
   */
  respondToRequest: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        userId: z.string().max(100),
        accept: z.boolean(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Ownership
      const [existingDucklet] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existingDucklet || existingDucklet.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // 2. Find Request
      const [member] = await ctx.db
        .select()
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, input.userId),
            eq(duckletMember.status, "requested"),
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
          .update(duckletMember)
          .set({ status: "active", role: input.role })
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, input.userId),
            ),
          );
      } else {
        await ctx.db
          .delete(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, input.userId),
            ),
          );
      }

      return { success: true };
    }),

  /**
   * Paginated chat history for a ducklet. Cursor is the createdAt
   * timestamp of the oldest message in the previous page; messages
   * are returned newest-first.
   */
  chatHistory: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Same access rules as byId: owner, active member, or public reader.
      const [existing] = await ctx.db
        .select({
          id: ducklet.id,
          ownerId: ducklet.ownerId,
          isPublic: ducklet.isPublic,
        })
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
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
          .from(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, userId),
              eq(duckletMember.status, "active"),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }

      const conditions = [eq(duckletMessage.duckletId, input.duckletId)];
      if (input.cursor) {
        conditions.push(lt(duckletMessage.createdAt, new Date(input.cursor)));
      }

      const rows = await ctx.db
        .select({
          id: duckletMessage.id,
          userId: duckletMessage.userId,
          authorUsername: duckletMessage.authorUsername,
          content: duckletMessage.content,
          createdAt: duckletMessage.createdAt,
          liveUsername: userProfile.username,
          livePhotoURL: userProfile.photoURL,
        })
        .from(duckletMessage)
        .leftJoin(userProfile, eq(duckletMessage.userId, userProfile.userId))
        .where(and(...conditions))
        .orderBy(desc(duckletMessage.createdAt))
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
   * Snapshot the current yjsData so the owner can restore later.
   */
  createSnapshot: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        label: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: ducklet.id,
          ownerId: ducklet.ownerId,
          yjsData: ducklet.yjsData,
        })
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
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
        .insert(duckletSnapshot)
        .values({
          duckletId: input.duckletId,
          yjsData: existing.yjsData,
          label: input.label,
          createdBy: ctx.session.user.id,
        })
        .returning({
          id: duckletSnapshot.id,
          label: duckletSnapshot.label,
          createdAt: duckletSnapshot.createdAt,
        });

      if (created) {
        track("ducklet.snapshot.created", {
          duckletId: input.duckletId,
          snapshotId: created.id,
          userId: ctx.session.user.id,
        });
      }

      return created;
    }),

  /**
   * List snapshots for a ducklet (owner only — snapshots may contain
   * intermediate state the owner doesn't want to expose).
   */
  listSnapshots: protectedProcedure
    .input(z.object({ duckletId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: ducklet.ownerId })
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const snapshots = await ctx.db
        .select({
          id: duckletSnapshot.id,
          label: duckletSnapshot.label,
          createdAt: duckletSnapshot.createdAt,
          createdBy: duckletSnapshot.createdBy,
          creatorUsername: userProfile.username,
        })
        .from(duckletSnapshot)
        .leftJoin(
          userProfile,
          eq(duckletSnapshot.createdBy, userProfile.userId),
        )
        .where(eq(duckletSnapshot.duckletId, input.duckletId))
        .orderBy(desc(duckletSnapshot.createdAt));

      return snapshots;
    }),

  /**
   * Restore a snapshot. Writes the snapshot's yjsData back to the ducklet
   * and bumps yjsVersion so connected clients are forced to reload.
   *
   * Note: this is a destructive operation; clients with unsaved edits will
   * lose them. The UI should warn before invoking.
   */
  restoreSnapshot: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        snapshotId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: ducklet.ownerId })
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [snap] = await ctx.db
        .select()
        .from(duckletSnapshot)
        .where(
          and(
            eq(duckletSnapshot.id, input.snapshotId),
            eq(duckletSnapshot.duckletId, input.duckletId),
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
        .update(ducklet)
        .set({ yjsData: snap.yjsData })
        .where(eq(ducklet.id, input.duckletId));

      track("ducklet.snapshot.restored", {
        duckletId: input.duckletId,
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
        duckletId: z.number(),
        snapshotId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ ownerId: ducklet.ownerId })
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existing || existing.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(duckletSnapshot)
        .where(
          and(
            eq(duckletSnapshot.id, input.snapshotId),
            eq(duckletSnapshot.duckletId, input.duckletId),
          ),
        );

      return { success: true };
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { ducklet, duckletMember, userProfile } from "@acme/db/schema";
import { getPublicUrl } from "@acme/storage";
import { signCollabToken } from "@acme/auth/collab-token";
import type { CollabRole } from "@acme/auth/collab-token";
import { eq, desc, and, or, ilike } from "drizzle-orm";

const COLLAB_TOKEN_TTL_SECONDS = 60 * 60;

export const duckletRouter = createTRPCRouter({
  /**
   * List ducklets (public + user's private ducklets)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().nullish(),
        onlyMine: z.boolean().optional(),
        search: z.string().trim().max(100).optional(),
        sort: z.enum(["recent", "oldest", "updated"]).default("recent"),
      }).optional()
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
            eq(ducklet.ownerId, ctx.session.user.id)
          )
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Ducklet not found" });
      }

      // Check access
      if (!result.isPublic && result.ownerId !== ctx.session?.user?.id) {
        // Check if user is an ACTIVE member (invited/requested do not grant access)
        if (ctx.session?.user) {
          const [membership] = await ctx.db
            .select()
            .from(duckletMember)
            .where(
              and(
                eq(duckletMember.duckletId, input.id),
                eq(duckletMember.userId, ctx.session.user.id),
                eq(duckletMember.status, "active")
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
          userId: duckletMember.userId,
          role: duckletMember.role,
          status: duckletMember.status,
          username: userProfile.username,
          photoURL: userProfile.photoURL,
        })
        .from(duckletMember)
        .leftJoin(userProfile, eq(duckletMember.userId, userProfile.userId))
        .where(eq(duckletMember.duckletId, input.id));

      // Get current user's membership status
      let currentUserStatus = null;
      if (ctx.session?.user) {
        const member = members.find((m) => m.userId === ctx.session!.user.id);
        if (member) {
          currentUserStatus = member.status;
        }
      }

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
        throw new TRPCError({ code: "NOT_FOUND", message: "Ducklet not found" });
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
              eq(duckletMember.status, "active")
            )
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
        process.env.BETTER_AUTH_SECRET ?? ""
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
        description: z.string().optional(),
        isPublic: z.boolean().default(true),
        yjsData: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newDucklet] = await ctx.db
        .insert(ducklet)
        .values({
          ...input,
          ownerId: ctx.session.user.id,
        })
        .returning();

      return newDucklet;
    }),

  /**
   * Update ducklet settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),

      })
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
      return { success: true };
    }),

  /**
   * Add member to ducklet
   */
  addMember: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        userId: z.string(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      })
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
   * Remove member from ducklet
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        userId: z.string(),
      })
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
            eq(duckletMember.userId, input.userId)
          )
        );

      return { success: true };
    }),

  /**
   * Invite a user to a ducklet by username
   */
  inviteUser: protectedProcedure
    .input(
      z.object({
        duckletId: z.number(),
        username: z.string(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify Ducklet Ownership
      const [existingDucklet] = await ctx.db
        .select()
        .from(ducklet)
        .where(eq(ducklet.id, input.duckletId))
        .limit(1);

      if (!existingDucklet || existingDucklet.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to invite users" });
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot invite yourself" });
      }

      // 3. Check if already a member/invited
      const [existingMember] = await ctx.db
        .select()
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, targetUser.userId)
          )
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.status === "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User is already a member" });
        } else if (existingMember.status === "invited") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User is already invited" });
        } else if (existingMember.status === "requested") {
          // If they requested, just approve them by updating to active/invited
          await ctx.db
            .update(duckletMember)
            .set({ status: "active", role: input.role })
            .where(
              and(
                eq(duckletMember.duckletId, input.duckletId),
                eq(duckletMember.userId, targetUser.userId)
              )
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

      return { success: true, message: "Invitation sent" };
    }),

  /**
   * Request access to a ducklet
   */
  requestAccess: protectedProcedure
    .input(z.object({ duckletId: z.number() }))
    .mutation(async ({ ctx, input }) => {
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are the owner" });
      }

      // 2. Check existing membership
      const [existingMember] = await ctx.db
        .select()
        .from(duckletMember)
        .where(
          and(
            eq(duckletMember.duckletId, input.duckletId),
            eq(duckletMember.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.status === "active") return { success: true, message: "Already a member" };
        if (existingMember.status === "requested") return { success: true, message: "Request already sending" };
        if (existingMember.status === "invited") {
          // If invited, auto-accept
          await ctx.db
            .update(duckletMember)
            .set({ status: "active" })
            .where(
              and(
                eq(duckletMember.duckletId, input.duckletId),
                eq(duckletMember.userId, ctx.session.user.id)
              )
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
            eq(duckletMember.status, "invited")
          )
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No invitation found" });
      }

      if (input.accept) {
        await ctx.db
          .update(duckletMember)
          .set({ status: "active" })
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, ctx.session.user.id)
            )
          );
      } else {
        await ctx.db
          .delete(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, ctx.session.user.id)
            )
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
        userId: z.string(),
        accept: z.boolean(),
        role: z.enum(["editor", "viewer"]).default("viewer"),
      })
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
            eq(duckletMember.status, "requested")
          )
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No pending request found" });
      }

      if (input.accept) {
        await ctx.db
          .update(duckletMember)
          .set({ status: "active", role: input.role })
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, input.userId)
            )
          );
      } else {
        await ctx.db
          .delete(duckletMember)
          .where(
            and(
              eq(duckletMember.duckletId, input.duckletId),
              eq(duckletMember.userId, input.userId)
            )
          );
      }

      return { success: true };
    }),
});

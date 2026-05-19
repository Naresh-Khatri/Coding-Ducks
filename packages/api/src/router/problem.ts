import { z } from "zod/v4";

import { problemService } from "../services/problem.service";
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

const difficulty = z.enum(["easy", "medium", "hard"]);

const testCaseSchema = z.object({
  input: z.string().optional(),
  output: z.string().optional(),
  args: z.array(z.string()).optional(),
  expected: z.string().optional(),
  isPublic: z.boolean(),
});

const functionSignatureSchema = z.object({
  fnName: z.string(),
  params: z.array(z.object({ name: z.string(), type: z.string() })),
  returnType: z.string(),
});

export const problemRouter = createTRPCRouter({
  /** List active problems (public). */
  list: publicProcedure
    .input(
      z
        .object({
          difficulty: difficulty.optional(),
          tags: z.array(z.string()).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().default(0),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      problemService.list(
        ctx.db,
        {
          difficulty: input?.difficulty,
          tags: input?.tags,
          search: input?.search,
          limit: input?.limit ?? 20,
          offset: input?.offset ?? 0,
        },
        ctx.session?.user?.id,
      ),
    ),

  /** Get a problem by slug (public — active only, sanitized test cases). */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) =>
      problemService.getBySlug(ctx.db, input.slug, ctx.session?.user?.id),
    ),

  /** Preview a problem by slug, drafts included (admin — sanitized). */
  adminBySlug: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) =>
      problemService.getBySlugAdmin(ctx.db, input.slug, ctx.session.user.id),
    ),

  /** Get a problem by id with full data for editing (admin). */
  adminById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => problemService.getByIdAdmin(ctx.db, input.id)),

  /** Distinct tags across active problems (public). */
  tags: publicProcedure.query(({ ctx }) => problemService.tags(ctx.db)),

  /** Create a problem (admin). */
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        title: z.string().min(1).max(256),
        description: z.string().min(1),
        editorial: z.string().optional(),
        hints: z.array(z.string()).default([]),
        constraints: z.string().optional(),
        companies: z.array(z.string()).default([]),
        followUp: z.string().optional(),
        difficulty,
        testCases: z.array(testCaseSchema),
        starterCode: z.record(z.string(), z.string()).optional(),
        functionSignature: functionSignatureSchema.optional(),
        tags: z.array(z.string()).default([]),
        timeLimit: z.number().int().positive().optional(),
        memoryLimit: z.number().int().positive().optional(),
        displayOrder: z.number().default(0),
      }),
    )
    .mutation(({ ctx, input }) => problemService.create(ctx.db, input)),

  /** Update a problem (admin). */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        slug: z.string().min(1).max(100).optional(),
        title: z.string().min(1).max(256).optional(),
        description: z.string().min(1).optional(),
        editorial: z.string().nullable().optional(),
        hints: z.array(z.string()).optional(),
        constraints: z.string().nullable().optional(),
        companies: z.array(z.string()).optional(),
        followUp: z.string().nullable().optional(),
        difficulty: difficulty.optional(),
        testCases: z.array(testCaseSchema).optional(),
        starterCode: z.record(z.string(), z.string()).optional(),
        functionSignature: functionSignatureSchema.optional(),
        tags: z.array(z.string()).optional(),
        timeLimit: z.number().int().positive().nullable().optional(),
        memoryLimit: z.number().int().positive().nullable().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }),
    )
    .mutation(({ ctx, input }) => problemService.update(ctx.db, input)),

  /** Delete a problem (admin). */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => problemService.delete(ctx.db, input.id)),

  /** Duplicate a problem as a draft (admin). */
  duplicate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => problemService.duplicate(ctx.db, input.id)),
});

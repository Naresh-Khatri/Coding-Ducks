import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { userCodeDraft } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const codeDraftRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
        code: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userCodeDraft)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          lang: input.lang,
          code: input.code,
        })
        .onConflictDoUpdate({
          target: [
            userCodeDraft.userId,
            userCodeDraft.problemId,
            userCodeDraft.lang,
          ],
          set: { code: input.code },
        });

      return { success: true };
    }),

  get: protectedProcedure
    .input(z.object({ problemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drafts = await ctx.db
        .select({ lang: userCodeDraft.lang, code: userCodeDraft.code })
        .from(userCodeDraft)
        .where(
          and(
            eq(userCodeDraft.userId, ctx.session.user.id),
            eq(userCodeDraft.problemId, input.problemId),
          ),
        );

      if (drafts.length === 0) return null;

      const result: Record<string, string> = {};
      for (const d of drafts) {
        result[d.lang] = d.code;
      }
      return result;
    }),
});

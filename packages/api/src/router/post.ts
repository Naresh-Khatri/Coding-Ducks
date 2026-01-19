// import type { TRPCRouterRecord } from "@trpc/server";
// import { z } from "zod/v4";
//
// import { CreatePostSchema, desc, eq, Post } from "@acme/db";
//
// import { protectedProcedure, publicProcedure } from "../trpc";
//
// export const postRouter = {
//   all: publicProcedure.query(({ ctx }) => {
//     return ctx.db.select().from(Post).limit(10).orderBy(desc(Post.id));
//   }),
//
//   byId: publicProcedure
//     .input(z.object({ id: z.string() }))
//     .query(({ ctx, input }) => {
//       return ctx.db.select().from(Post).where(eq(Post.id, input.id));
//     }),
//
//   create: protectedProcedure
//     .input(CreatePostSchema)
//     .mutation(({ ctx, input }) => {
//       return ctx.db.insert(Post).values(input);
//     }),
//
//   delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
//     return ctx.db.delete(Post).where(eq(Post.id, input));
//   }),
// } satisfies TRPCRouterRecord;

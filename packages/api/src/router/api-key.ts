// import crypto from "crypto";
// import type { TRPCRouterRecord } from "@trpc/server";
// import { z } from "zod/v4";
//
// import {
//   and,
//   apiKey,
//   apiKeyUsage,
//   CreateApiKeySchema,
//   desc,
//   eq,
//   gte,
//   lte,
//   sql,
// } from "@acme/db";
//
// import { protectedProcedure } from "../trpc";
//
// function generateApiKey(): string {
//   return `sk_live_${crypto.randomBytes(32).toString("hex")}`;
// }
//
// // Hash an API key for secure storage
// function hashApiKey(key: string): string {
//   return crypto.createHash("sha256").update(key).digest("hex");
// }
//
// // Extract prefix from API key for display
// function getKeyPrefix(key: string): string {
//   return key.substring(0, 16) + "...";
// }
//
// export const apiKeyRouter = {
//   list: protectedProcedure.query(async ({ ctx }) => {
//     const userId = ctx.session.user.id;
//
//     const keys = await ctx.db
//       .select({
//         id: apiKey.id,
//         name: apiKey.name,
//         prefix: apiKey.prefix,
//         status: apiKey.status,
//         lastUsedAt: apiKey.lastUsedAt,
//         totalRequests: apiKey.totalRequests,
//         successfulRequests: apiKey.successfulRequests,
//         failedRequests: apiKey.failedRequests,
//         createdAt: apiKey.createdAt,
//       })
//       .from(apiKey)
//       .where(eq(apiKey.userId, userId))
//       .orderBy(desc(apiKey.createdAt));
//
//     return keys;
//   }),
//
//   create: protectedProcedure
//     .input(CreateApiKeySchema)
//     .mutation(async ({ ctx, input }) => {
//       const userId = ctx.session.user.id;
//
//       // Generate a new API key
//       const key = generateApiKey();
//       const keyHash = hashApiKey(key);
//       const prefix = getKeyPrefix(key);
//
//       // Insert into database
//       const [newKey] = await ctx.db
//         .insert(apiKey)
//         .values({
//           userId,
//           name: input.name,
//           keyHash,
//           prefix,
//           status: "active",
//         })
//         .returning({
//           id: apiKey.id,
//           name: apiKey.name,
//           prefix: apiKey.prefix,
//           status: apiKey.status,
//           createdAt: apiKey.createdAt,
//         });
//
//       // Return the full key (only time it's ever shown)
//       return {
//         ...newKey,
//         key, // Full key - only returned on creation
//       };
//     }),
//
//   revoke: protectedProcedure
//     .input(z.object({ id: z.string().uuid() }))
//     .mutation(async ({ ctx, input }) => {
//       const userId = ctx.session.user.id;
//
//       // Update the key status to revoked
//       const [updated] = await ctx.db
//         .update(apiKey)
//         .set({ status: "revoked" })
//         .where(eq(apiKey.id, input.id))
//         .returning();
//
//       // Verify the key belongs to the user
//       if (updated?.userId !== userId) {
//         throw new Error("Unauthorized");
//       }
//
//       return updated;
//     }),
//
//   delete: protectedProcedure
//     .input(z.object({ id: z.string().uuid() }))
//     .mutation(async ({ ctx, input }) => {
//       const userId = ctx.session.user.id;
//
//       // First verify ownership
//       const [existing] = await ctx.db
//         .select()
//         .from(apiKey)
//         .where(eq(apiKey.id, input.id));
//
//       if (existing?.userId !== userId) {
//         throw new Error("Unauthorized");
//       }
//
//       // Delete the key
//       await ctx.db.delete(apiKey).where(eq(apiKey.id, input.id));
//
//       return { success: true };
//     }),
//
//   getUsageHistory: protectedProcedure
//     .input(z.object({ days: z.enum(["7", "30"]).default("7") }))
//     .query(async ({ ctx, input }) => {
//       const userId = ctx.session.user.id;
//       const daysCount = parseInt(input.days);
//
//       const startDate = new Date();
//       startDate.setDate(startDate.getDate() - daysCount);
//       const startDateStr = startDate.toISOString().split("T")[0]!;
//
//       // Fetch usage for all keys belonging to this user
//       const results = await ctx.db
//         .select({
//           day: apiKeyUsage.day,
//           count: sql<number>`SUM(${apiKeyUsage.count})`,
//           successful: sql<number>`SUM(${apiKeyUsage.successful})`,
//           failed: sql<number>`SUM(${apiKeyUsage.failed})`,
//         })
//         .from(apiKeyUsage)
//         .innerJoin(apiKey, eq(apiKeyUsage.apiKeyId, apiKey.id))
//         .where(
//           and(eq(apiKey.userId, userId), gte(apiKeyUsage.day, startDateStr)),
//         )
//         .groupBy(apiKeyUsage.day)
//         .orderBy(apiKeyUsage.day);
//
//       return results;
//     }),
//
//   getLanguageUsage: protectedProcedure.query(async ({ ctx }) => {
//     const userId = ctx.session.user.id;
//
//     const results = await ctx.db
//       .select({
//         language: apiKeyUsage.language,
//         value: sql<number>`SUM(${apiKeyUsage.count})`,
//       })
//       .from(apiKeyUsage)
//       .innerJoin(apiKey, eq(apiKeyUsage.apiKeyId, apiKey.id))
//       .where(eq(apiKey.userId, userId))
//       .groupBy(apiKeyUsage.language)
//       .orderBy(desc(sql`SUM(${apiKeyUsage.count})`));
//
//     return results;
//   }),
// } satisfies TRPCRouterRecord;

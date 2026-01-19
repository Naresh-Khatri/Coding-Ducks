import { z } from "zod";

import { getPresignedUploadUrl } from "@acme/storage";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const storageRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .mutation(async ({ input }) => {
      const { filename, contentType } = input;
      // Use a timestamp to prevent collisions, or rely on client to provide unique name
      // Simple implementation: Key = input filename
      const { url, key } = await getPresignedUploadUrl(filename, contentType);
      return { url, key };
    }),
});

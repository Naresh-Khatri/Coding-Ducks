import { authRouter } from "./router/auth";
import { bookmarkRouter } from "./router/bookmark";
import { codeDraftRouter } from "./router/code-draft";
import { commentRouter } from "./router/comment";
import { duckletRouter } from "./router/ducklet";
import { playgroundRouter } from "./router/playground";
import { machineCodingRouter } from "./router/machine-coding";
import { problemRouter } from "./router/problem";
import { profileRouter } from "./router/profile";
import { storageRouter } from "./router/storage";
import { submissionRouter } from "./router/submission";
import { systemDesignRouter } from "./router/system-design";
// import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // post: postRouter,
  problem: problemRouter,
  submission: submissionRouter,
  codeDraft: codeDraftRouter,
  playground: playgroundRouter,
  storage: storageRouter,
  ducklet: duckletRouter,
  machineCoding: machineCodingRouter,
  profile: profileRouter,
  bookmark: bookmarkRouter,
  comment: commentRouter,
  systemDesign: systemDesignRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

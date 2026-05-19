// import { apiKeyRouter } from "./router/api-key";
import { authRouter } from "./router/auth";
import { bookmarkRouter } from "./router/bookmark";
import { commentRouter } from "./router/comment";
import { solutionRouter } from "./router/solution";
import { systemDesignRouter } from "./router/system-design";
import { codeDraftRouter } from "./router/code-draft";
import { duckletRouter } from "./router/ducklet";
import { playgroundRouter } from "./router/playground";
import { problemRouter } from "./router/problem";
import { profileRouter } from "./router/profile";
import { storageRouter } from "./router/storage";
import { submissionRouter } from "./router/submission";
// import { postRouter } from "./router/post";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // post: postRouter,
  // apiKey: apiKeyRouter,
  user: userRouter,
  problem: problemRouter,
  submission: submissionRouter,
  codeDraft: codeDraftRouter,
  playground: playgroundRouter,
  storage: storageRouter,
  ducklet: duckletRouter,
  profile: profileRouter,
  bookmark: bookmarkRouter,
  comment: commentRouter,
  solution: solutionRouter,
  systemDesign: systemDesignRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

// import { apiKeyRouter } from "./router/api-key";
import { authRouter } from "./router/auth";
import { duckletRouter } from "./router/ducklet";
import { problemRouter } from "./router/problem";
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
  storage: storageRouter,
  ducklet: duckletRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

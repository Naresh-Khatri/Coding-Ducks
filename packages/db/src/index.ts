import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "../env";
import * as schema from "./schema";

export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/pg-core";
export { eq, desc, asc, and, or } from "drizzle-orm";

// export * from "./schema";
export {
  ducklet,
  duckletMember,
  duckletMessage,
  account,
  user,
  userProfile,
  session,
  challenge,
  challengeAttempt,
  problem,
  submission,
  bookmark,
} from "./schema";

export const db: NodePgDatabase<typeof schema> = drizzle({
  connection: env.POSTGRES_URL,
  schema,
  casing: "snake_case",
});

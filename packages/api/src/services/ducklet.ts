import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { ducklet } from "@acme/db/schema";

// Accepts the drizzle db (or a transaction): only `insert` is needed here, and
// its signature doesn't depend on the schema generic.
type Database = Pick<NodePgDatabase, "insert">;

export interface CreateDuckletInput {
  name: string;
  ownerId: string;
  description?: string | null;
  isPublic: boolean;
  /** Base64-encoded Yjs snapshot to pre-seed the room with. */
  yjsData?: string | null;
  kind?: "ducklet" | "machine-coding";
}

/**
 * Insert a ducklet row and return it. Shared by `ducklet.create`,
 * `ducklet.fork`, and `machineCoding.createInterviewRoom` so the insert shape lives
 * in exactly one place.
 */
export async function createDuckletRow(
  database: Database,
  input: CreateDuckletInput,
) {
  const [row] = await database
    .insert(ducklet)
    .values({
      name: input.name,
      description: input.description ?? null,
      isPublic: input.isPublic,
      yjsData: input.yjsData ?? null,
      ownerId: input.ownerId,
      kind: input.kind ?? "ducklet",
    })
    .returning();
  return row;
}

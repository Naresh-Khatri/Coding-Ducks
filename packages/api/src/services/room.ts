import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { RoomKind } from "@acme/db";
import { room } from "@acme/db/schema";

// Accepts the drizzle db (or a transaction): only `insert` is needed here, and
// its signature doesn't depend on the schema generic.
type Database = Pick<NodePgDatabase, "insert">;

export interface CreateRoomInput {
  name: string;
  ownerId: string;
  description?: string | null;
  isPublic: boolean;
  /** Base64-encoded Yjs snapshot to pre-seed the room with. */
  yjsData?: string | null;
  kind?: RoomKind;
}

/**
 * Insert a room row and return it. Shared by `room.create`, `room.fork`, and
 * `machineCoding.createInterviewRoom` so the insert shape lives in exactly one
 * place.
 */
export async function createRoom(database: Database, input: CreateRoomInput) {
  const [row] = await database
    .insert(room)
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

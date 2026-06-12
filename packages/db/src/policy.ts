import { roomKindEnum } from "./schema/enums";

/** The kind discriminator on a room (a collaborative coding room). */
export type RoomKind = (typeof roomKindEnum.enumValues)[number];

/** What a room of a given kind is allowed to do. */
export interface RoomPolicy {
  /** AI assist (ghost-text completion + Ask) is available. */
  aiEnabled: boolean;
  /** Surfaces in the public listing. */
  listedPublicly: boolean;
  /** Can be forked into a new room. */
  forkable: boolean;
  /** Spawned from the machine-coding catalogue (has a problem + countdown). */
  isInterview: boolean;
}

/**
 * Single source of truth for room capabilities, derived from `kind` in exactly
 * one place. Fail-CLOSED: every capability is granted to the free-form
 * "ducklet" kind and withheld from everything else, so a newly-added kind starts
 * locked down (no AI, unlisted, not forkable) and must opt into each capability
 * here explicitly — rather than silently inheriting permissions because some
 * check elsewhere only excluded "machine-coding".
 */
export function roomPolicy(kind: RoomKind): RoomPolicy {
  const isFreeform = kind === "ducklet";
  return {
    aiEnabled: isFreeform,
    listedPublicly: isFreeform,
    forkable: isFreeform,
    isInterview: kind === "machine-coding",
  };
}

/** Everything the Workspace + practice panel need to render practice mode. */
export interface MachineCodingContext {
  slug: string;
  title: string;
  difficulty: string;
  /** Catalogue category key, e.g. "ui-component". */
  category: string;
  durationMinutes: number;
  /** Problem statement, markdown. */
  description: string;
  /** Topic tags. */
  tags: string[];
  /** Companies known to have asked this question. */
  companies: string[];
  /** Epoch ms the attempt started — drives the countdown. */
  startedAt: number;
  solutionRevealed: boolean;
  /** When true, test-run / completion are also mirrored to the DB. */
  isSignedIn: boolean;
  /**
   * The interview room this attempt was already upgraded to, if any. Drives the
   * "Open interview room" shortcut in the Problem panel — null inside the room
   * itself so it never links to the page you're already on.
   */
  roomId: number | null;
  /** Saved attempt summary (signed-in only); null for anonymous attempts. */
  attempt: {
    status: string;
    testsLastPassed: number | null;
    testsLastTotal: number | null;
  } | null;
}

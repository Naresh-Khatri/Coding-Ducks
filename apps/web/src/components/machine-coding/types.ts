/** Everything the Workspace + practice panel need to render practice mode. */
export interface MachineCodingContext {
  slug: string;
  title: string;
  difficulty: string;
  durationMinutes: number;
  /** Problem statement, markdown. */
  description: string;
  /** Epoch ms the attempt started — drives the countdown. */
  startedAt: number;
  solutionRevealed: boolean;
  /** When true, test-run / completion are also mirrored to the DB. */
  isSignedIn: boolean;
}

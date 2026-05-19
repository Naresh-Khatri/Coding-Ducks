import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import type { db } from "@acme/db";
import { problem, submission } from "@acme/db/schema";

/** The Drizzle database handle (same instance as `ctx.db`). */
type ProblemDb = typeof db;

type Difficulty = "easy" | "medium" | "hard";

interface TestCaseInput {
  input?: string;
  output?: string;
  args?: string[];
  expected?: string;
  isPublic: boolean;
}

interface FunctionSignatureInput {
  fnName: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
}

export interface ListProblemsArgs {
  difficulty?: Difficulty;
  tags?: string[];
  search?: string;
  limit: number;
  offset: number;
}

export interface CreateProblemArgs {
  slug: string;
  title: string;
  description: string;
  editorial?: string;
  difficulty: Difficulty;
  testCases: TestCaseInput[];
  starterCode?: Record<string, string>;
  functionSignature?: FunctionSignatureInput;
  tags: string[];
  displayOrder: number;
}

export interface UpdateProblemArgs {
  id: number;
  slug?: string;
  title?: string;
  description?: string;
  editorial?: string | null;
  difficulty?: Difficulty;
  testCases?: TestCaseInput[];
  starterCode?: Record<string, string>;
  functionSignature?: FunctionSignatureInput;
  tags?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

/** Fetch a single problem row by slug, or throw NOT_FOUND. */
async function loadBySlug(db: ProblemDb, slug: string) {
  const [row] = await db
    .select()
    .from(problem)
    .where(eq(problem.slug, slug))
    .limit(1);

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
  }

  return row;
}

/**
 * Hide private test cases — strip inputs AND expected answers
 * (`args`/`expected` leak the solution for function-signature problems).
 */
function sanitizeTestCases(testCases: typeof problem.$inferSelect.testCases) {
  return testCases.map((tc) =>
    tc.isPublic
      ? tc
      : {
          input: "[Hidden]",
          output: "[Hidden]",
          args: undefined,
          expected: undefined,
          isPublic: false,
        },
  );
}

/** Attach the given user's best submission for a problem (or null). */
async function getBestSubmission(
  db: ProblemDb,
  problemId: number,
  userId: string,
) {
  const [accepted] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.userId, userId),
        eq(submission.problemId, problemId),
        eq(submission.status, "accepted"),
      ),
    )
    .limit(1);

  if (accepted) return accepted;

  const [latest] = await db
    .select()
    .from(submission)
    .where(
      and(eq(submission.userId, userId), eq(submission.problemId, problemId)),
    )
    .orderBy(
      desc(submission.status),
      desc(submission.testsPassed),
      desc(submission.createdAt),
    )
    .limit(1);

  return latest ?? null;
}

/**
 * Shared user-facing shape: sanitized test cases + the caller's best
 * submission when logged in. Used by both the public and admin-preview reads.
 */
async function toUserFacingProblem(
  db: ProblemDb,
  prob: typeof problem.$inferSelect,
  userId?: string,
) {
  return {
    ...prob,
    testCases: sanitizeTestCases(prob.testCases),
    bestSubmission: userId
      ? await getBestSubmission(db, prob.id, userId)
      : null,
  };
}

export const problemService = {
  /** List active problems with filters, pagination, and per-user status. */
  async list(db: ProblemDb, args: ListProblemsArgs, userId?: string) {
    const { difficulty, tags, search, limit, offset } = args;

    const conditions = [eq(problem.isActive, true)];
    if (difficulty) conditions.push(eq(problem.difficulty, difficulty));
    if (search) conditions.push(ilike(problem.title, `%${search}%`));
    if (tags && tags.length > 0) {
      conditions.push(sql`${problem.tags} && ${tags}`);
    }

    const problems = await db
      .select({
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags,
        displayOrder: problem.displayOrder,
        createdAt: problem.createdAt,
      })
      .from(problem)
      .where(and(...conditions))
      .orderBy(problem.displayOrder, problem.id)
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(problem)
      .where(and(...conditions));

    const total = Number(countRow?.count ?? 0);

    const problemIds = problems.map((p) => p.id);

    const acceptanceRates: Record<number, { total: number; accepted: number }> =
      {};
    const userStatuses: Record<number, "solved" | "attempted"> = {};

    if (problemIds.length > 0) {
      const stats = await db
        .select({
          problemId: submission.problemId,
          total: sql<number>`count(*)`,
          accepted: sql<number>`count(*) filter (where ${submission.status} = 'accepted')`,
        })
        .from(submission)
        .where(inArray(submission.problemId, problemIds))
        .groupBy(submission.problemId);

      for (const s of stats) {
        acceptanceRates[s.problemId] = {
          total: Number(s.total),
          accepted: Number(s.accepted),
        };
      }

      if (userId) {
        const userSubmissions = await db
          .select({
            problemId: submission.problemId,
            status: submission.status,
          })
          .from(submission)
          .where(
            and(
              eq(submission.userId, userId),
              inArray(submission.problemId, problemIds),
            ),
          );

        for (const sub of userSubmissions) {
          if (sub.status === "accepted") {
            userStatuses[sub.problemId] = "solved";
          } else if (userStatuses[sub.problemId] !== "solved") {
            userStatuses[sub.problemId] = "attempted";
          }
        }
      }
    }

    return {
      items: problems.map((p) => {
        const rate = acceptanceRates[p.id];
        return {
          ...p,
          userStatus: userStatuses[p.id] ?? null,
          acceptanceRate:
            rate && rate.total > 0
              ? Math.round((rate.accepted / rate.total) * 100)
              : null,
        };
      }),
      total,
      hasMore: offset + problems.length < total,
    };
  },

  /** Public read: active problems only, sanitized test cases. */
  async getBySlug(db: ProblemDb, slug: string, userId?: string) {
    const prob = await loadBySlug(db, slug);

    if (!prob.isActive) {
      // Don't reveal that a draft exists at this slug
      throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
    }

    return toUserFacingProblem(db, prob, userId);
  },

  /**
   * Admin read by slug: any status (incl. drafts), still sanitized so the
   * admin sees exactly the user-facing page. Full data is in `getByIdAdmin`.
   */
  async getBySlugAdmin(db: ProblemDb, slug: string, userId?: string) {
    const prob = await loadBySlug(db, slug);
    return toUserFacingProblem(db, prob, userId);
  },

  /** Admin read by id: full data including private test cases. */
  async getByIdAdmin(db: ProblemDb, id: number) {
    const [row] = await db
      .select()
      .from(problem)
      .where(eq(problem.id, id))
      .limit(1);

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
    }

    return row;
  },

  /** Distinct tags across active problems. */
  async tags(db: ProblemDb) {
    const result = await db.execute(
      sql`SELECT DISTINCT unnest(${problem.tags}) as tag FROM ${problem} WHERE ${problem.isActive} = true ORDER BY tag`,
    );

    return (result.rows as { tag: string }[]).map((r) => ({
      name: r.tag,
      slug: r.tag,
    }));
  },

  /** Create a problem (admin). */
  async create(db: ProblemDb, input: CreateProblemArgs) {
    const [created] = await db
      .insert(problem)
      .values({
        ...input,
        starterCode: input.starterCode,
        functionSignature: input.functionSignature,
        testCases: input.testCases,
      })
      .returning();

    return created;
  },

  /** Update a problem (admin). */
  async update(db: ProblemDb, input: UpdateProblemArgs) {
    const { id, ...updates } = input;

    const [updated] = await db
      .update(problem)
      .set({
        ...updates,
        starterCode: updates.starterCode,
        functionSignature: updates.functionSignature,
      })
      .where(eq(problem.id, id))
      .returning();

    return updated;
  },

  /** Delete a problem (admin). Submissions cascade via FK. */
  async delete(db: ProblemDb, id: number) {
    const [deleted] = await db
      .delete(problem)
      .where(eq(problem.id, id))
      .returning();

    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
    }

    return { success: true };
  },

  /** Duplicate a problem as an inactive draft (admin). */
  async duplicate(db: ProblemDb, id: number) {
    const [original] = await db
      .select()
      .from(problem)
      .where(eq(problem.id, id))
      .limit(1);

    if (!original) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
    }

    const [duplicated] = await db
      .insert(problem)
      .values({
        slug: `${original.slug}-copy-${Date.now()}`,
        title: `${original.title} (Copy)`,
        description: original.description,
        difficulty: original.difficulty,
        tags: original.tags,
        testCases: original.testCases,
        starterCode: original.starterCode,
        displayOrder: original.displayOrder ?? 0,
        isActive: false,
      })
      .returning();

    return duplicated;
  },
};

# Phase 2: Problems Feature

> **Prerequisite**: Complete [Phase 1: Foundation](./phase-1-foundation.md) first.

---

## Goals

1. ✅ Problems list page with filtering and search
2. ✅ Problem detail page with code editor
3. ✅ Integration with cd-judge-api for code execution
4. ✅ Submissions history and results display
5. ✅ Admin problem management (create/edit)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /problems              │  /problems/[slug]                      │
│  ┌───────────────────┐  │  ┌─────────────────────────────────┐  │
│  │ Problems List     │  │  │ Split Pane Layout               │  │
│  │ - Filters         │  │  │ ┌───────────┬─────────────────┐ │  │
│  │ - Search          │  │  │ │ Problem   │ Code Editor     │ │  │
│  │ - Pagination      │  │  │ │ Statement │ (CodeMirror)    │ │  │
│  └───────────────────┘  │  │ │           ├─────────────────┤ │  │
│                         │  │ │           │ Output Console  │ │  │
│                         │  │ └───────────┴─────────────────┘ │  │
│                         │  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ tRPC
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (tRPC)                            │
│  problemRouter: list, bySlug, tags, create, update              │
│  submissionRouter: submit, list, byId                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                     cd-judge-api                                 │
│  POST /execute { code, lang, testCases }                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ticket 2.1: Complete Problem tRPC Router

### File: `packages/api/src/router/problem.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { problem, problemTag, problemToTag, submission } from "@acme/db/schema";
import { eq, desc, and, like, sql, inArray } from "drizzle-orm";

export const problemRouter = createTRPCRouter({
  /**
   * List problems with optional filters
   */
  list: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        tagSlugs: z.array(z.string()).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { difficulty, tagSlugs, search, limit, offset } = input ?? {};

      // Base query
      let query = ctx.db
        .select({
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          displayOrder: problem.displayOrder,
        })
        .from(problem)
        .where(eq(problem.isActive, true));

      // Apply filters
      const conditions = [eq(problem.isActive, true)];
      
      if (difficulty) {
        conditions.push(eq(problem.difficulty, difficulty));
      }
      
      if (search) {
        conditions.push(like(problem.title, `%${search}%`));
      }

      // Get problems with filters
      const problems = await ctx.db
        .select({
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          displayOrder: problem.displayOrder,
        })
        .from(problem)
        .where(and(...conditions))
        .orderBy(problem.displayOrder, problem.id)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(problem)
        .where(and(...conditions));

      const total = countResult[0]?.count ?? 0;

      // If user is logged in, get their submission status for each problem
      let userStatuses: Record<number, "solved" | "attempted" | null> = {};
      
      if (ctx.session?.user) {
        const problemIds = problems.map((p) => p.id);
        
        if (problemIds.length > 0) {
          const userSubmissions = await ctx.db
            .select({
              problemId: submission.problemId,
              status: submission.status,
            })
            .from(submission)
            .where(
              and(
                eq(submission.userId, ctx.session.user.id),
                inArray(submission.problemId, problemIds)
              )
            );

          for (const sub of userSubmissions) {
            const current = userStatuses[sub.problemId];
            if (sub.status === "accepted") {
              userStatuses[sub.problemId] = "solved";
            } else if (!current) {
              userStatuses[sub.problemId] = "attempted";
            }
          }
        }
      }

      return {
        items: problems.map((p) => ({
          ...p,
          userStatus: userStatuses[p.id] ?? null,
        })),
        total,
        hasMore: offset + problems.length < total,
      };
    }),

  /**
   * Get problem by slug
   */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.slug, input.slug))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }

      const prob = result[0];

      // Get tags for this problem
      const tags = await ctx.db
        .select({
          id: problemTag.id,
          name: problemTag.name,
          slug: problemTag.slug,
        })
        .from(problemTag)
        .innerJoin(problemToTag, eq(problemToTag.tagId, problemTag.id))
        .where(eq(problemToTag.problemId, prob.id));

      // Hide private test cases (only show structure, not content)
      const sanitizedTestCases = prob.testCases.map((tc) =>
        tc.isPublic ? tc : { isPublic: false, input: "", output: "" }
      );

      // Get user's best submission if logged in
      let bestSubmission = null;
      if (ctx.session?.user) {
        const subs = await ctx.db
          .select()
          .from(submission)
          .where(
            and(
              eq(submission.userId, ctx.session.user.id),
              eq(submission.problemId, prob.id)
            )
          )
          .orderBy(desc(submission.testsPassed))
          .limit(1);

        bestSubmission = subs[0] ?? null;
      }

      return {
        ...prob,
        testCases: sanitizedTestCases,
        tags,
        bestSubmission,
      };
    }),

  /**
   * Get all tags
   */
  tags: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(problemTag).orderBy(problemTag.name);
  }),

  /**
   * Create problem (Admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        title: z.string().min(1).max(256),
        description: z.string().min(1),
        difficulty: z.enum(["easy", "medium", "hard"]),
        testCases: z.array(
          z.object({
            input: z.string(),
            output: z.string(),
            isPublic: z.boolean(),
          })
        ),
        starterCode: z.record(z.string()).optional(),
        tagIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if admin
      // TODO: Add admin check from userProfile
      
      const { tagIds, ...problemData } = input;

      const [newProblem] = await ctx.db
        .insert(problem)
        .values(problemData)
        .returning();

      // Add tags
      if (tagIds && tagIds.length > 0) {
        await ctx.db.insert(problemToTag).values(
          tagIds.map((tagId) => ({
            problemId: newProblem.id,
            tagId,
          }))
        );
      }

      return newProblem;
    }),

  /**
   * Update problem (Admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        slug: z.string().min(1).max(100).optional(),
        title: z.string().min(1).max(256).optional(),
        description: z.string().min(1).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        testCases: z
          .array(
            z.object({
              input: z.string(),
              output: z.string(),
              isPublic: z.boolean(),
            })
          )
          .optional(),
        starterCode: z.record(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [updated] = await ctx.db
        .update(problem)
        .set(updates)
        .where(eq(problem.id, id))
        .returning();

      return updated;
    }),
});
```

---

## Ticket 2.2: Submission Router with cd-judge-api Integration

### File: `packages/api/src/router/submission.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { submission, problem, userProfile } from "@acme/db/schema";
import { eq, desc, and } from "drizzle-orm";

// cd-judge-api client
const JUDGE_API_URL = process.env.JUDGE_API_URL ?? "http://localhost:3001";

interface JudgeResult {
  results: Array<{
    passed: boolean;
    stdout: string;
    stderr: string;
    runtime: number;
    memory: number;
  }>;
  totalRuntime: number;
  passedCount: number;
  totalCount: number;
}

async function executeCode(
  code: string,
  lang: string,
  testCases: Array<{ input: string; output: string }>
): Promise<JudgeResult> {
  const response = await fetch(`${JUDGE_API_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      lang,
      inputs: testCases.map((tc) => tc.input),
      expectedOutputs: testCases.map((tc) => tc.output),
    }),
  });

  if (!response.ok) {
    throw new Error("Judge API error");
  }

  return response.json();
}

export const submissionRouter = createTRPCRouter({
  /**
   * Submit code for a problem
   */
  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get problem with test cases
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }

      // Create pending submission
      const [newSubmission] = await ctx.db
        .insert(submission)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          code: input.code,
          lang: input.lang,
          status: "running",
          testsTotal: prob.testCases.length,
        })
        .returning();

      try {
        // Execute code against test cases
        const result = await executeCode(
          input.code,
          input.lang,
          prob.testCases
        );

        // Determine status
        const status =
          result.passedCount === result.totalCount
            ? "accepted"
            : "wrong_answer";

        // Prepare results (hide private test case details)
        const results = result.results.map((r, i) => ({
          passed: r.passed,
          runtime: r.runtime,
          ...(prob.testCases[i].isPublic
            ? {
                input: prob.testCases[i].input,
                expected: prob.testCases[i].output,
                actual: r.stdout,
              }
            : {}),
          ...(r.stderr ? { error: r.stderr } : {}),
        }));

        // Update submission
        const [updated] = await ctx.db
          .update(submission)
          .set({
            status,
            testsPassed: result.passedCount,
            runtime: result.totalRuntime,
            results,
          })
          .where(eq(submission.id, newSubmission.id))
          .returning();

        // Award points for first accepted submission
        if (status === "accepted") {
          const existingAccepted = await ctx.db
            .select()
            .from(submission)
            .where(
              and(
                eq(submission.userId, ctx.session.user.id),
                eq(submission.problemId, input.problemId),
                eq(submission.status, "accepted"),
                ne(submission.id, newSubmission.id) // Exclude current
              )
            )
            .limit(1);

          if (existingAccepted.length === 0) {
            // First accepted submission - award points
            const points =
              prob.difficulty === "easy"
                ? 10
                : prob.difficulty === "medium"
                ? 20
                : 30;

            await ctx.db
              .update(userProfile)
              .set({
                points: sql`${userProfile.points} + ${points}`,
              })
              .where(eq(userProfile.userId, ctx.session.user.id));
          }
        }

        return updated;
      } catch (error) {
        // Update submission with error
        await ctx.db
          .update(submission)
          .set({
            status: "runtime_error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(submission.id, newSubmission.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Code execution failed",
        });
      }
    }),

  /**
   * Run code without submitting (just for testing)
   */
  run: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Only run against public test cases
      const publicTestCases = prob.testCases.filter((tc) => tc.isPublic);

      const result = await executeCode(input.code, input.lang, publicTestCases);

      return {
        results: result.results.map((r, i) => ({
          passed: r.passed,
          input: publicTestCases[i].input,
          expected: publicTestCases[i].output,
          actual: r.stdout,
          error: r.stderr || undefined,
          runtime: r.runtime,
        })),
        passedCount: result.passedCount,
        totalCount: result.totalCount,
      };
    }),

  /**
   * List submissions for a problem
   */
  list: protectedProcedure
    .input(
      z.object({
        problemId: z.number().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(submission.userId, ctx.session.user.id)];

      if (input.problemId) {
        conditions.push(eq(submission.problemId, input.problemId));
      }

      const submissions = await ctx.db
        .select()
        .from(submission)
        .where(and(...conditions))
        .orderBy(desc(submission.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return submissions;
    }),

  /**
   * Get submission by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [sub] = await ctx.db
        .select()
        .from(submission)
        .where(
          and(
            eq(submission.id, input.id),
            eq(submission.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return sub;
    }),
});
```

---

## Ticket 2.3: CodeMirror Editor Component

### File: `apps/web/src/components/code-editor/index.tsx`

```tsx
"use client";

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

export type Language = "py" | "js" | "java" | "cpp" | "c";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

const languageExtensions = {
  py: () => python(),
  js: () => javascript(),
  java: () => java(),
  cpp: () => cpp(),
  c: () => cpp(),
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "400px",
  className,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const langExt = languageExtensions[language];
    return [
      langExt(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height },
        ".cm-scroller": { overflow: "auto" },
      }),
    ];
  }, [language, height]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={oneDark}
      readOnly={readOnly}
      className={className}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
    />
  );
}
```

### Dependencies to Install

```bash
pnpm add @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-cpp @codemirror/lang-java @codemirror/theme-one-dark
```

---

## Ticket 2.4: Problems List Page

### File: `apps/web/src/app/(main)/problems/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { CheckCircle, Circle, Loader2, Search } from "lucide-react";
import { cn } from "~/lib/utils";

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string | undefined>();

  const { data, isLoading } = api.problem.list.useQuery({
    search: search || undefined,
    difficulty: difficulty as "easy" | "medium" | "hard" | undefined,
    limit: 50,
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Problems</h1>
        <p className="text-muted-foreground">
          Practice coding problems and improve your skills
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Problems Table */}
      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground">
          <div className="w-8">Status</div>
          <div>Title</div>
          <div className="w-24 text-center">Difficulty</div>
          <div className="w-20 text-center">Solved</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No problems found
          </div>
        ) : (
          data?.items.map((problem, index) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.slug}`}
              className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors items-center"
            >
              <div className="w-8">
                {problem.userStatus === "solved" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : problem.userStatus === "attempted" ? (
                  <Circle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
              <div>
                <span className="text-muted-foreground mr-2">
                  {index + 1}.
                </span>
                {problem.title}
              </div>
              <div className="w-24 text-center">
                <Badge
                  variant="outline"
                  className={cn(DIFFICULTY_COLORS[problem.difficulty])}
                >
                  {problem.difficulty}
                </Badge>
              </div>
              <div className="w-20 text-center text-muted-foreground">
                {/* TODO: Add solved count */}
                --
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination info */}
      {data && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Showing {data.items.length} of {data.total} problems
        </div>
      )}
    </div>
  );
}
```

---

## Ticket 2.5: Problem Detail Page

### File: `apps/web/src/app/(main)/problems/[slug]/page.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { CodeEditor, type Language } from "~/components/code-editor";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Loader2, Play, Send, CheckCircle, XCircle } from "lucide-react";
import { cn } from "~/lib/utils";

const LANGUAGES = [
  { value: "py", label: "Python" },
  { value: "js", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

export default function ProblemPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [language, setLanguage] = useState<Language>("py");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");

  const { data: problem, isLoading } = api.problem.bySlug.useQuery(
    { slug },
    {
      onSuccess: (data) => {
        // Set initial code from starter code
        if (data.starterCode?.[language]) {
          setCode(data.starterCode[language]);
        }
      },
    }
  );

  const runMutation = api.submission.run.useMutation();
  const submitMutation = api.submission.submit.useMutation();

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (problem?.starterCode?.[lang]) {
        setCode(problem.starterCode[lang]);
      } else {
        setCode("");
      }
    },
    [problem]
  );

  const handleRun = () => {
    if (!problem) return;
    runMutation.mutate({
      problemId: problem.id,
      code,
      lang: language,
    });
  };

  const handleSubmit = () => {
    if (!problem) return;
    submitMutation.mutate({
      problemId: problem.id,
      code,
      lang: language,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        Problem not found
      </div>
    );
  }

  const isRunning = runMutation.isLoading || submitMutation.isLoading;

  return (
    <div className="h-[calc(100vh-64px)]">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - Problem Description */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-auto p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    problem.difficulty === "easy" &&
                      "bg-green-500/20 text-green-400",
                    problem.difficulty === "medium" &&
                      "bg-yellow-500/20 text-yellow-400",
                    problem.difficulty === "hard" &&
                      "bg-red-500/20 text-red-400"
                  )}
                >
                  {problem.difficulty}
                </Badge>
                {problem.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4">
                {/* Render markdown description */}
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />

                {/* Example test cases */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Examples</h3>
                  {problem.testCases
                    .filter((tc) => tc.isPublic)
                    .map((tc, i) => (
                      <div
                        key={i}
                        className="mb-4 rounded-lg border bg-muted/50 p-4"
                      >
                        <div className="mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Input:
                          </span>
                          <pre className="mt-1 text-sm">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Output:
                          </span>
                          <pre className="mt-1 text-sm">{tc.output}</pre>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="submissions">
                <SubmissionsTab problemId={problem.id} />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Editor + Console */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Code Editor */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <Select
                    value={language}
                    onValueChange={(v) => handleLanguageChange(v as Language)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRun}
                      disabled={isRunning}
                    >
                      {runMutation.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isRunning}
                    >
                      {submitMutation.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={language}
                    height="100%"
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Console Output */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full overflow-auto p-4 bg-black/50">
                <h3 className="text-sm font-medium mb-3">Output</h3>
                <ConsoleOutput
                  runResult={runMutation.data}
                  submitResult={submitMutation.data}
                  isLoading={isRunning}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function ConsoleOutput({ runResult, submitResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Running...
      </div>
    );
  }

  const result = submitResult || runResult;
  if (!result) {
    return (
      <div className="text-muted-foreground text-sm">
        Run your code to see output
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2">
        {result.status === "accepted" || result.passedCount === result.totalCount ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <span>
          {result.passedCount ?? result.testsPassed} / {result.totalCount ?? result.testsTotal} tests passed
        </span>
      </div>

      {/* Individual results */}
      {result.results?.map((r, i) => (
        <div
          key={i}
          className={cn(
            "rounded border p-3 text-sm",
            r.passed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
          )}
        >
          <div className="font-medium mb-1">Test Case {i + 1}</div>
          {r.input && (
            <div className="text-muted-foreground">
              Input: <code>{r.input}</code>
            </div>
          )}
          {r.expected && (
            <div className="text-muted-foreground">
              Expected: <code>{r.expected}</code>
            </div>
          )}
          {r.actual && (
            <div>
              Output: <code>{r.actual}</code>
            </div>
          )}
          {r.error && (
            <div className="text-red-400">Error: {r.error}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function SubmissionsTab({ problemId }: { problemId: number }) {
  const { data: submissions } = api.submission.list.useQuery({ problemId });

  if (!submissions?.length) {
    return <div className="text-muted-foreground">No submissions yet</div>;
  }

  return (
    <div className="space-y-2">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="flex items-center justify-between p-3 rounded border"
        >
          <div className="flex items-center gap-3">
            {sub.status === "accepted" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="capitalize">{sub.status.replace("_", " ")}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {sub.lang} • {sub.runtime}ms
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Dependencies to Install

```bash
# In apps/web
pnpm add @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-cpp @codemirror/lang-java @codemirror/theme-one-dark

# shadcn components needed
pnpm dlx shadcn@latest add resizable tabs badge
```

---

## Verification Checklist

- [ ] `pnpm dev` runs without errors
- [ ] `/problems` page loads and shows empty state
- [ ] Difficulty filter works
- [ ] Search filter works  
- [ ] `/problems/[slug]` page loads with problem data
- [ ] Code editor renders and accepts input
- [ ] Language switcher updates editor mode
- [ ] "Run" button calls API and shows results
- [ ] "Submit" button saves submission to DB
- [ ] Submissions tab shows history

---

## Next Phase

After completing Phase 2, proceed to [Phase 3: Ducklets](./phase-3-ducklets.md).

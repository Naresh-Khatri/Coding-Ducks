# Phase 4: UI Challenges

> **Prerequisite**: Complete [Phase 1: Foundation](./phase-1-foundation.md) first.

---

## Goals

1. ✅ Challenges gallery with difficulty filter
2. ✅ Challenge detail page with target preview
3. ✅ Attempt editor (HTML/CSS/JS with live preview)
4. ✅ Screenshot capture and image comparison
5. ✅ Scoring system and leaderboards

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Challenge Attempt Flow                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User opens challenge     2. User writes code                 │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐  │
│  │   Target Preview    │    │  HTML │ CSS │ JS  │ Preview    │  │
│  │   (Goal to match)   │    │  ─────┴─────┴─────┼───────────  │  │
│  └─────────────────────┘    │  Editor           │ Live iframe │  │
│                             └─────────────────────────────────┘  │
│                                                                   │
│  3. User submits            4. Backend compares                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐  │
│  │  POST /submit       │───▶│  - Take screenshot (Puppeteer) │  │
│  │  {html, css, js}    │    │  - Compare with target (Python) │  │
│  └─────────────────────┘    │  - Calculate similarity score   │  │
│                             └─────────────────────────────────┘  │
│                                                                   │
│  5. Score returned          6. Leaderboard updated               │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐  │
│  │  Score: 847/1000    │    │  🏆 User1: 982                  │  │
│  │  Diff overlay shown │    │  🥈 User2: 945                  │  │
│  └─────────────────────┘    │  🥉 User3: 891                  │  │
│                             └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Ticket 4.1: Challenge tRPC Router

### File: `packages/api/src/router/challenge.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { challenge, challengeAttempt, userProfile } from "@acme/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const challengeRouter = createTRPCRouter({
  /**
   * List all public challenges
   */
  list: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["newbie", "junior", "intermediate", "advanced", "master"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { difficulty, limit, offset } = input ?? {};

      const conditions = [eq(challenge.isPublic, true)];
      if (difficulty) {
        conditions.push(eq(challenge.difficulty, difficulty));
      }

      const challenges = await ctx.db
        .select({
          id: challenge.id,
          slug: challenge.slug,
          title: challenge.title,
          difficulty: challenge.difficulty,
          desktopPreview: challenge.desktopPreview,
          createdAt: challenge.createdAt,
        })
        .from(challenge)
        .where(and(...conditions))
        .orderBy(desc(challenge.createdAt))
        .limit(limit)
        .offset(offset);

      // Get attempt count for each challenge
      const challengeIds = challenges.map((c) => c.id);
      const attemptCounts = await ctx.db
        .select({
          challengeId: challengeAttempt.challengeId,
          count: sql<number>`count(*)`,
        })
        .from(challengeAttempt)
        .where(
          and(
            inArray(challengeAttempt.challengeId, challengeIds),
            eq(challengeAttempt.status, "submitted")
          )
        )
        .groupBy(challengeAttempt.challengeId);

      const countsMap = new Map(attemptCounts.map((a) => [a.challengeId, a.count]));

      return challenges.map((c) => ({
        ...c,
        submissionCount: countsMap.get(c.id) ?? 0,
      }));
    }),

  /**
   * Get challenge by slug
   */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select()
        .from(challenge)
        .where(eq(challenge.slug, input.slug))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
      }

      // Get user's best attempt if logged in
      let userAttempt = null;
      if (ctx.session?.user) {
        const [attempt] = await ctx.db
          .select()
          .from(challengeAttempt)
          .where(
            and(
              eq(challengeAttempt.challengeId, result.id),
              eq(challengeAttempt.userId, ctx.session.user.id)
            )
          )
          .orderBy(desc(challengeAttempt.score))
          .limit(1);
        userAttempt = attempt;
      }

      return { ...result, userAttempt };
    }),

  /**
   * Get leaderboard for a challenge
   */
  leaderboard: publicProcedure
    .input(z.object({ challengeId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const attempts = await ctx.db
        .select({
          id: challengeAttempt.id,
          score: challengeAttempt.score,
          screenshotURL: challengeAttempt.screenshotURL,
          submittedAt: challengeAttempt.submittedAt,
          user: {
            username: userProfile.username,
            photoURL: userProfile.photoURL,
          },
        })
        .from(challengeAttempt)
        .leftJoin(userProfile, eq(challengeAttempt.userId, userProfile.userId))
        .where(
          and(
            eq(challengeAttempt.challengeId, input.challengeId),
            eq(challengeAttempt.status, "submitted")
          )
        )
        .orderBy(desc(challengeAttempt.score))
        .limit(input.limit);

      return attempts;
    }),

  /**
   * Create challenge (Admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        title: z.string().min(1).max(256),
        description: z.string().optional(),
        difficulty: z.enum(["newbie", "junior", "intermediate", "advanced", "master"]),
        contentHTML: z.string(),
        contentCSS: z.string(),
        contentJS: z.string().default(""),
        desktopPreview: z.string(), // R2 URL
        mobilePreview: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Check admin role

      const [newChallenge] = await ctx.db
        .insert(challenge)
        .values({
          ...input,
          creatorId: ctx.session.user.id,
        })
        .returning();

      return newChallenge;
    }),
});
```

---

## Ticket 4.2: Attempt Router

### File: `packages/api/src/router/attempt.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { challengeAttempt, challenge } from "@acme/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { uploadFile } from "@acme/storage";

// Python comparison service URL
const COMPARISON_API = process.env.COMPARISON_API_URL ?? "http://localhost:8000";

interface ComparisonResult {
  score: number; // 0-1000
  diffImageBase64: string;
}

async function compareImages(targetURL: string, outputBase64: string): Promise<ComparisonResult> {
  const response = await fetch(`${COMPARISON_API}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetURL,
      outputImage: outputBase64,
    }),
  });

  if (!response.ok) {
    throw new Error("Comparison service error");
  }

  return response.json();
}

export const attemptRouter = createTRPCRouter({
  /**
   * Start or get existing draft attempt
   */
  start: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check for existing draft
      const [existing] = await ctx.db
        .select()
        .from(challengeAttempt)
        .where(
          and(
            eq(challengeAttempt.challengeId, input.challengeId),
            eq(challengeAttempt.userId, ctx.session.user.id),
            eq(challengeAttempt.status, "draft")
          )
        )
        .orderBy(desc(challengeAttempt.createdAt))
        .limit(1);

      if (existing) {
        return existing;
      }

      // Create new draft
      const [newAttempt] = await ctx.db
        .insert(challengeAttempt)
        .values({
          challengeId: input.challengeId,
          userId: ctx.session.user.id,
          contentHTML: "",
          contentCSS: "",
          contentJS: "",
          status: "draft",
        })
        .returning();

      return newAttempt;
    }),

  /**
   * Save attempt (auto-save)
   */
  save: protectedProcedure
    .input(
      z.object({
        attemptId: z.number(),
        contentHTML: z.string(),
        contentCSS: z.string(),
        contentJS: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { attemptId, ...content } = input;

      // Verify ownership
      const [existing] = await ctx.db
        .select()
        .from(challengeAttempt)
        .where(
          and(
            eq(challengeAttempt.id, attemptId),
            eq(challengeAttempt.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.db
        .update(challengeAttempt)
        .set(content)
        .where(eq(challengeAttempt.id, attemptId))
        .returning();

      return updated;
    }),

  /**
   * Submit attempt for scoring
   */
  submit: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get attempt
      const [attempt] = await ctx.db
        .select()
        .from(challengeAttempt)
        .where(
          and(
            eq(challengeAttempt.id, input.attemptId),
            eq(challengeAttempt.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!attempt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get challenge for target image
      const [chall] = await ctx.db
        .select()
        .from(challenge)
        .where(eq(challenge.id, attempt.challengeId))
        .limit(1);

      if (!chall) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Generate screenshot of user's code
      // This would typically be done with Puppeteer or a screenshot service
      const screenshotBase64 = await generateScreenshot({
        html: attempt.contentHTML,
        css: attempt.contentCSS,
        js: attempt.contentJS,
      });

      // Upload screenshot to R2
      const screenshotBuffer = Buffer.from(screenshotBase64, "base64");
      const screenshotKey = `challenges/${chall.slug}/attempts/${ctx.session.user.id}/${Date.now()}.png`;
      const screenshotURL = await uploadFile(screenshotKey, screenshotBuffer, "image/png");

      // Compare images using Python service
      const comparison = await compareImages(chall.desktopPreview, screenshotBase64);

      // Upload diff image
      const diffBuffer = Buffer.from(comparison.diffImageBase64, "base64");
      const diffKey = `challenges/${chall.slug}/attempts/${ctx.session.user.id}/${Date.now()}-diff.png`;
      const diffImageURL = await uploadFile(diffKey, diffBuffer, "image/png");

      // Update attempt with results
      const [updated] = await ctx.db
        .update(challengeAttempt)
        .set({
          status: "submitted",
          score: comparison.score,
          screenshotURL,
          diffImageURL,
          submittedAt: new Date(),
        })
        .where(eq(challengeAttempt.id, input.attemptId))
        .returning();

      return updated;
    }),

  /**
   * Get attempt by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [attempt] = await ctx.db
        .select()
        .from(challengeAttempt)
        .where(eq(challengeAttempt.id, input.id))
        .limit(1);

      if (!attempt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Only allow owner to view
      if (attempt.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return attempt;
    }),

  /**
   * Get user's attempts for a challenge
   */
  myAttempts: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(challengeAttempt)
        .where(
          and(
            eq(challengeAttempt.challengeId, input.challengeId),
            eq(challengeAttempt.userId, ctx.session.user.id)
          )
        )
        .orderBy(desc(challengeAttempt.createdAt));
    }),
});

// Screenshot generation helper (placeholder - implement with Puppeteer)
async function generateScreenshot(content: {
  html: string;
  css: string;
  js: string;
}): Promise<string> {
  // TODO: Implement with Puppeteer or a screenshot service
  // For now, this is a placeholder
  throw new Error("Screenshot generation not implemented");
}
```

---

## Ticket 4.3: Python Image Comparison Service

Keep your existing Python service. Here's a minimal FastAPI wrapper:

### File: `services/image-comparison/main.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import requests
from io import BytesIO

app = FastAPI()

class CompareRequest(BaseModel):
    targetURL: str
    outputImage: str  # Base64 encoded

class CompareResponse(BaseModel):
    score: int  # 0-1000
    diffImageBase64: str

def url_to_image(url: str) -> np.ndarray:
    """Download image from URL and convert to numpy array"""
    response = requests.get(url)
    image = np.asarray(bytearray(response.content), dtype="uint8")
    return cv2.imdecode(image, cv2.IMREAD_COLOR)

def base64_to_image(b64: str) -> np.ndarray:
    """Convert base64 string to numpy array"""
    image_data = base64.b64decode(b64)
    image = np.asarray(bytearray(image_data), dtype="uint8")
    return cv2.imdecode(image, cv2.IMREAD_COLOR)

def image_to_base64(image: np.ndarray) -> str:
    """Convert numpy array to base64 string"""
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

def compute_similarity(target: np.ndarray, output: np.ndarray) -> tuple[int, np.ndarray]:
    """
    Compute similarity score between target and output images.
    Returns score (0-1000) and diff image.
    """
    # Resize output to match target if needed
    if target.shape != output.shape:
        output = cv2.resize(output, (target.shape[1], target.shape[0]))
    
    # Convert to grayscale for comparison
    target_gray = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    output_gray = cv2.cvtColor(output, cv2.COLOR_BGR2GRAY)
    
    # Compute absolute difference
    diff = cv2.absdiff(target_gray, output_gray)
    
    # Create colored diff for visualization
    diff_colored = cv2.cvtColor(diff, cv2.COLOR_GRAY2BGR)
    diff_colored[diff > 0] = [0, 0, 255]  # Red for differences
    
    # Blend with output for visualization
    diff_overlay = cv2.addWeighted(output, 0.7, diff_colored, 0.3, 0)
    
    # Calculate score (1 - mean_error normalized to 0-1000)
    total_pixels = target.shape[0] * target.shape[1]
    different_pixels = np.count_nonzero(diff)
    similarity_ratio = 1 - (different_pixels / total_pixels)
    score = int(similarity_ratio * 1000)
    
    return score, diff_overlay

@app.post("/compare", response_model=CompareResponse)
async def compare_images(request: CompareRequest):
    try:
        # Load images
        target = url_to_image(request.targetURL)
        output = base64_to_image(request.outputImage)
        
        # Compute similarity
        score, diff_image = compute_similarity(target, output)
        
        return CompareResponse(
            score=score,
            diffImageBase64=image_to_base64(diff_image)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### `services/image-comparison/requirements.txt`

```
fastapi==0.109.0
uvicorn==0.27.0
opencv-python-headless==4.9.0.80
numpy==1.26.3
requests==2.31.0
pydantic==2.6.0
```

### `services/image-comparison/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Ticket 4.4: Challenges Gallery Page

### File: `apps/web/src/app/(main)/challenges/page.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

const DIFFICULTY_COLORS = {
  newbie: "bg-green-500/20 text-green-400",
  junior: "bg-blue-500/20 text-blue-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-orange-500/20 text-orange-400",
  master: "bg-red-500/20 text-red-400",
};

export default function ChallengesPage() {
  const [difficulty, setDifficulty] = useState<string | undefined>();

  const { data: challenges, isLoading } = api.challenge.list.useQuery({
    difficulty: difficulty as any,
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">UI Challenges</h1>
        <p className="text-muted-foreground">
          Recreate designs using HTML & CSS. Compete for the highest score!
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="newbie">Newbie</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="master">Master</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges?.map((challenge) => (
          <Link key={challenge.id} href={`/challenges/${challenge.slug}`}>
            <div className="group rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors">
              {/* Preview Image */}
              <div className="relative aspect-video bg-muted">
                <Image
                  src={challenge.desktopPreview}
                  alt={challenge.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(DIFFICULTY_COLORS[challenge.difficulty])}
                  >
                    {challenge.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {challenge.submissionCount} submissions
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## Ticket 4.5: Challenge Attempt Page

### File: `apps/web/src/app/(main)/challenges/[slug]/attempt/page.tsx`

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Loader2, Send, Eye, EyeOff } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { debounce } from "lodash";

export default function AttemptPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // State
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [activeTab, setActiveTab] = useState("html");
  const [showTarget, setShowTarget] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // Queries
  const { data: challenge } = api.challenge.bySlug.useQuery({ slug });
  
  const startMutation = api.attempt.start.useMutation({
    onSuccess: (data) => {
      setAttemptId(data.id);
      setHtmlCode(data.contentHTML);
      setCssCode(data.contentCSS);
      setJsCode(data.contentJS ?? "");
    },
  });

  const saveMutation = api.attempt.save.useMutation();
  const submitMutation = api.attempt.submit.useMutation({
    onSuccess: (data) => {
      // Show result modal or redirect
      router.push(`/challenges/${slug}?submitted=${data.score}`);
    },
  });

  // Start attempt when challenge loads
  useEffect(() => {
    if (challenge && !attemptId) {
      startMutation.mutate({ challengeId: challenge.id });
    }
  }, [challenge]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce((content: { html: string; css: string; js: string }) => {
      if (!attemptId) return;
      saveMutation.mutate({
        attemptId,
        contentHTML: content.html,
        contentCSS: content.css,
        contentJS: content.js,
      });
    }, 1000),
    [attemptId]
  );

  // Update code and trigger autosave
  const handleCodeChange = (type: "html" | "css" | "js", value: string) => {
    if (type === "html") setHtmlCode(value);
    if (type === "css") setCssCode(value);
    if (type === "js") setJsCode(value);

    debouncedSave({
      html: type === "html" ? value : htmlCode,
      css: type === "css" ? value : cssCode,
      js: type === "js" ? value : jsCode,
    });
  };

  // Generate preview HTML
  const previewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>${jsCode}</script>
      </body>
    </html>
  `;

  const handleSubmit = () => {
    if (!attemptId) return;
    submitMutation.mutate({ attemptId });
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">{challenge.title}</h2>
          {saveMutation.isLoading && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTarget(!showTarget)}
          >
            {showTarget ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showTarget ? "Hide" : "Show"} Target
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitMutation.isLoading}
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

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-48px)]">
        {/* Code Editor */}
        <ResizablePanel defaultSize={50}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="m-2">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="js">JS</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="html" className="h-full m-0">
                <CodeMirror
                  value={htmlCode}
                  onChange={(v) => handleCodeChange("html", v)}
                  extensions={[html()]}
                  theme={oneDark}
                  className="h-full"
                />
              </TabsContent>
              <TabsContent value="css" className="h-full m-0">
                <CodeMirror
                  value={cssCode}
                  onChange={(v) => handleCodeChange("css", v)}
                  extensions={[css()]}
                  theme={oneDark}
                  className="h-full"
                />
              </TabsContent>
              <TabsContent value="js" className="h-full m-0">
                <CodeMirror
                  value={jsCode}
                  onChange={(v) => handleCodeChange("js", v)}
                  extensions={[javascript()]}
                  theme={oneDark}
                  className="h-full"
                />
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={50}>
          <div className="h-full relative">
            {/* User's output */}
            <iframe
              srcDoc={previewHTML}
              className="w-full h-full bg-white"
              sandbox="allow-scripts"
            />

            {/* Target overlay */}
            {showTarget && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <img
                  src={challenge.desktopPreview}
                  alt="Target"
                  className="max-w-full max-h-full object-contain border-2 border-primary"
                />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

---

## Dependencies to Install

```bash
# In apps/web
pnpm add lodash @types/lodash

# shadcn components
pnpm dlx shadcn@latest add tabs
```

---

## Environment Variables

```env
# Image comparison service
COMPARISON_API_URL=http://localhost:8000
```

---

## Verification Checklist

- [ ] `/challenges` page shows challenge gallery
- [ ] Difficulty filter works
- [ ] Challenge preview images load
- [ ] Attempt page shows editors (HTML/CSS/JS)
- [ ] Live preview updates as code changes
- [ ] Auto-save works
- [ ] Target overlay toggle works
- [ ] Submit triggers screenshot + comparison
- [ ] Score is calculated and displayed
- [ ] Leaderboard shows correct rankings

---

## Next Phase

After completing Phase 4, proceed to [Phase 5: User Features](./phase-5-user-features.md).

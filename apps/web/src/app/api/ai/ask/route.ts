import { NextResponse } from "next/server";

import { db, room, eq, roomPolicy } from "@acme/db";

import { getSession } from "~/auth/server";
import { env } from "~/env";
import { DEFAULT_ASK_MODEL, isAllowedAskModel } from "~/lib/ai/models";

// Conversational "Ask mode": the client sends the conversation + a snapshot of
// every project file; the model replies with a short explanation and (when a
// change was asked for) file edits the client renders as diffs. Same Mistral
// key as the FIM route; one round trip per turn, no agent loop.
const CHAT_URL = "https://api.mistral.ai/v1/chat/completions";

// Cap on project text shipped upstream (the main cost lever); sent once per
// turn, folded into the latest user message, so history stays cheap.
const MAX_TOTAL_CHARS = 60_000;
const IGNORED = [
  /(^|\/)node_modules\//,
  /(^|\/)(pnpm-lock|package-lock)\.yaml$/,
  /\.lock$/,
];

const SYSTEM_PROMPT = `You are a coding assistant embedded in an in-browser web IDE, talking with the user about their project. The latest user message includes a snapshot of every project file.

Always respond with ONLY a JSON object of this exact shape:
{
  "explanation": "<a SHORT GitHub-flavored markdown reply to the user — a sentence or two, no code dumps>",
  "edits": [
    { "path": "<file>", "changes": [ { "search": "<exact existing code>", "replace": "<new code>" } ] },
    { "path": "<new file>", "content": "<full contents of a NEW file>" },
    { "path": "<file>", "delete": true }
  ]
}

How to edit:
- To CHANGE an existing file, use "changes": a list of search/replace blocks. "search" MUST be copied VERBATIM, character-for-character (including indentation and whitespace), from a snippet that currently exists in the file. "replace" is what that snippet becomes.
- Edit ONLY the lines that must change. Do NOT restate the whole file. Everything you don't touch stays exactly as it is — so never reproduce unrelated code, and never abbreviate with comments like "// ... unchanged ...".
- Make each "search" long enough to match exactly one place in the file (include a few surrounding lines of context). Use a separate block for each distinct change. To delete code, set "replace" to "".
- To CREATE a new file, use "content" with the full file body — only for a path that does not exist yet.
- To DELETE a file, use { "path": "...", "delete": true } — only when the user clearly asks to remove it.

Rules:
- If the user asked a question or no change is needed, answer in "explanation" and return an empty "edits" array.
- Prefer "changes" for every existing file. Only use "content" on an existing file when the user explicitly asks to replace the whole file.
- Touch only what the request needs; preserve all unrelated code, imports, and formatting.
- Include an entry ONLY for files you actually change, create, or delete; omit unchanged files.
- Keep "explanation" brief — the user reviews the actual changes as diffs in the editor, so do not paste code into it.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskBody {
  messages?: ChatMessage[];
  files?: Record<string, string>;
  model?: string;
  /** When set to a practice room, AI Ask is disabled server-side. */
  roomId?: number;
}

interface SearchReplace {
  /** Verbatim snippet that currently exists in the file. */
  search: string;
  /** What that snippet becomes ("" deletes it). */
  replace: string;
}

/** A single edit as proposed by the model. */
interface AskEdit {
  path: string;
  /** Search/replace blocks applied to an existing file (preferred). */
  changes?: SearchReplace[];
  /** Full contents — for creating a new file (or an explicit full rewrite). */
  content?: string;
  /** When true, delete the file instead of editing it. */
  delete?: boolean;
}

/** What the client receives — search/replace already resolved to final content. */
interface ResolvedEdit {
  path: string;
  content?: string;
  delete?: boolean;
}

interface AskResponse {
  explanation: string;
  edits: ResolvedEdit[];
  model: string;
}

/** Concatenate files (path-headed) up to the char budget; note what's dropped
 *  entirely (`omitted`) and what's sent only partially (`truncated`). */
function buildContext(files: Record<string, string>): {
  body: string;
  omitted: string[];
  truncated: string[];
} {
  const parts: string[] = [];
  const omitted: string[] = [];
  const truncated: string[] = [];
  let used = 0;

  for (const path of Object.keys(files).sort()) {
    if (IGNORED.some((re) => re.test(path))) continue;
    const content = files[path] ?? "";
    const header = `\n----- ${path} -----\n`;
    const remaining = MAX_TOTAL_CHARS - used - header.length;
    if (remaining <= 80) {
      omitted.push(path);
      continue;
    }
    const willTruncate = content.length > remaining;
    const slice = willTruncate
      ? `${content.slice(0, remaining)}\n…(truncated)…`
      : content;
    if (willTruncate) truncated.push(path);
    parts.push(header + slice);
    used += header.length + slice.length;
  }

  return { body: parts.join("\n"), omitted, truncated };
}

/** Keep only well-formed {role, content} turns. */
function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (
      m &&
      typeof m === "object" &&
      ((m as ChatMessage).role === "user" ||
        (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string" &&
      (m as ChatMessage).content.trim() !== ""
    ) {
      out.push({
        role: (m as ChatMessage).role,
        content: (m as ChatMessage).content,
      });
    }
  }
  return out;
}

/** Coerce the model's JSON into a well-formed list of edits, dropping garbage. */
function parseEdits(raw: unknown): AskEdit[] {
  if (
    !raw ||
    typeof raw !== "object" ||
    !Array.isArray((raw as { edits?: unknown }).edits)
  ) {
    return [];
  }
  const edits: AskEdit[] = [];
  for (const item of (raw as { edits: unknown[] }).edits) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    if (typeof e.path !== "string" || e.path.trim() === "") continue;
    const path = e.path.trim();

    if (e.delete === true) {
      edits.push({ path, delete: true });
      continue;
    }

    if (Array.isArray(e.changes)) {
      const changes: SearchReplace[] = [];
      for (const c of e.changes) {
        if (!c || typeof c !== "object") continue;
        const { search, replace } = c as Record<string, unknown>;
        // `search` must be non-empty; `replace` may be "" (a deletion).
        if (
          typeof search === "string" &&
          search !== "" &&
          typeof replace === "string"
        ) {
          changes.push({ search, replace });
        }
      }
      if (changes.length > 0) {
        edits.push({ path, changes });
        continue;
      }
    }

    if (typeof e.content === "string") {
      edits.push({ path, content: e.content });
    }
  }
  return edits;
}

/**
 * Apply one search/replace block to `content`. Tries an exact substring match
 * first (replacing the first occurrence), then falls back to a
 * whitespace-tolerant line match so a small indentation/trailing-space mismatch
 * in the model's `search` doesn't fail the edit. Returns null if the snippet
 * can't be located at all — the caller treats that as a failed block rather
 * than guessing.
 */
function applyBlock(
  content: string,
  search: string,
  replace: string,
): string | null {
  const idx = content.indexOf(search);
  if (idx !== -1) {
    return content.slice(0, idx) + replace + content.slice(idx + search.length);
  }

  const contentLines = content.split("\n");
  const searchLines = search.split("\n");
  // Models often append a trailing newline to a multi-line search block.
  if (searchLines.length > 1 && searchLines[searchLines.length - 1] === "") {
    searchLines.pop();
  }
  if (searchLines.length === 0) return null;

  const norm = (s: string) => s.trim();
  for (let i = 0; i + searchLines.length <= contentLines.length; i++) {
    let matched = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (norm(contentLines[i + j] ?? "") !== norm(searchLines[j] ?? "")) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const replaceLines = replace === "" ? [] : replace.split("\n");
    return [
      ...contentLines.slice(0, i),
      ...replaceLines,
      ...contentLines.slice(i + searchLines.length),
    ].join("\n");
  }
  return null;
}

/**
 * Turn model edits into final proposals the client can diff. Search/replace
 * edits are applied against the LIVE file contents (`files`) — so unrelated
 * code is never re-emitted and can't be dropped. Anything we couldn't apply is
 * skipped and surfaced as a human-readable note instead of silently mangling a
 * file. Whole-file `content` is allowed for new files and explicit rewrites,
 * but refused for an existing file whose snapshot was truncated in context
 * (the model never saw the whole thing).
 */
function resolveEdits(
  edits: AskEdit[],
  files: Record<string, string>,
  truncated: Set<string>,
): { proposals: ResolvedEdit[]; notes: string[] } {
  const proposals: ResolvedEdit[] = [];
  const notes: string[] = [];

  for (const e of edits) {
    if (e.delete) {
      proposals.push({ path: e.path, delete: true });
      continue;
    }

    if (e.changes && e.changes.length > 0) {
      const original = files[e.path];
      if (original === undefined) {
        notes.push(`Couldn't edit \`${e.path}\` — no such file.`);
        continue;
      }
      let current = original;
      let applied = 0;
      let failed = 0;
      for (const c of e.changes) {
        const next = applyBlock(current, c.search, c.replace);
        if (next === null) {
          failed++;
        } else {
          current = next;
          applied++;
        }
      }
      if (applied === 0) {
        notes.push(
          `Couldn't locate the code to change in \`${e.path}\` — left it untouched.`,
        );
        continue;
      }
      if (current === original) continue; // no-op after applying
      proposals.push({ path: e.path, content: current });
      if (failed > 0) {
        notes.push(
          `\`${e.path}\`: ${failed} of ${applied + failed} edits couldn't be applied — review carefully.`,
        );
      }
      continue;
    }

    if (typeof e.content === "string") {
      const exists = files[e.path] !== undefined;
      if (exists && truncated.has(e.path)) {
        notes.push(
          `Skipped a full rewrite of \`${e.path}\` (too large to send in full) — ask for a smaller, targeted change.`,
        );
        continue;
      }
      proposals.push({ path: e.path, content: e.content });
    }
  }

  return { proposals, notes };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MISTRAL_API_KEY is not set (check .env + restart dev server)" },
      { status: 503 },
    );
  }

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // AI is disabled in practice rooms — short-circuit before any upstream call.
  if (typeof body.roomId === "number") {
    const [found] = await db
      .select({ kind: room.kind })
      .from(room)
      .where(eq(room.id, body.roomId))
      .limit(1);
    if (found && !roomPolicy(found.kind).aiEnabled) {
      return NextResponse.json({
        explanation: "",
        edits: [],
        model: DEFAULT_ASK_MODEL,
      } satisfies AskResponse);
    }
  }

  const messages = sanitizeMessages(body.messages);
  const last = messages[messages.length - 1];
  if (last?.role !== "user") {
    return NextResponse.json(
      { error: "the last message must be from the user" },
      { status: 400 },
    );
  }

  const files = body.files && typeof body.files === "object" ? body.files : {};
  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: "no files provided" }, { status: 400 });
  }

  const model =
    body.model && isAllowedAskModel(body.model)
      ? body.model
      : DEFAULT_ASK_MODEL;

  const { body: context, omitted, truncated } = buildContext(files);
  const fileList = Object.keys(files).sort().join("\n");

  // Fold the current project snapshot into the latest user turn so prior turns
  // (text only) stay cheap and the model always sees up-to-date file contents.
  const latestUserContent = [
    last.content,
    "\n--- Current project files ---",
    fileList,
    omitted.length > 0
      ? `\n(Note: ${omitted.length} file(s) omitted to fit the context budget.)`
      : "",
    "\n--- File contents ---",
    context,
  ].join("\n");

  const upstreamMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.slice(0, -1),
    { role: "user" as const, content: latestUserContent },
  ];

  try {
    const upstream = await fetch(CHAT_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: upstreamMessages,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.warn("[ai-ask] mistral error", upstream.status, detail);
      return NextResponse.json(
        { error: `mistral ${upstream.status}` },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as {
      choices?: {
        message?: { content?: string };
        finish_reason?: string;
      }[];
    };
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";

    // Cut off by the token cap — the JSON (and any whole-file content) is
    // incomplete, so refuse to apply anything rather than write a truncated file.
    if (choice?.finish_reason === "length") {
      return NextResponse.json({
        explanation:
          "The response was cut off before finishing. Try a smaller or more focused request.",
        edits: [],
        model,
      } satisfies AskResponse);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({
        explanation: content || "The model returned an unparseable response.",
        edits: [],
        model,
      } satisfies AskResponse);
    }

    const explanation =
      parsed &&
      typeof (parsed as { explanation?: unknown }).explanation === "string"
        ? (parsed as { explanation: string }).explanation
        : "";

    // Resolve search/replace blocks against the live files into final content;
    // any block we couldn't apply becomes a note appended to the reply.
    const { proposals, notes } = resolveEdits(
      parseEdits(parsed),
      files,
      new Set(truncated),
    );
    const fullExplanation =
      notes.length > 0
        ? [explanation, ...notes.map((n) => `> ${n}`)]
            .filter(Boolean)
            .join("\n\n")
        : explanation;

    return NextResponse.json({
      explanation: fullExplanation,
      edits: proposals,
      model,
    } satisfies AskResponse);
  } catch (err) {
    console.warn("[ai-ask] request failed", err);
    return NextResponse.json(
      { error: "request to mistral failed" },
      { status: 502 },
    );
  }
}

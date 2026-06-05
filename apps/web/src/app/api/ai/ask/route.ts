import { NextResponse } from "next/server";

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
    { "path": "<project-relative file path>", "content": "<the COMPLETE new contents of the file>" }
  ]
}

Rules:
- If the user asked a question or no change is needed, answer in "explanation" and return an empty "edits" array.
- When you do change code, "content" MUST be the entire file after your change — never a diff, patch, or snippet.
- Include an entry ONLY for files you actually change or create; omit unchanged files.
- To create a new file, use its new path. Do not attempt to delete files.
- Keep "explanation" brief — the user reviews the actual changes as diffs in the editor, so do not paste code into it.
- Keep changes minimal and focused; preserve the project's existing style.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskBody {
  messages?: ChatMessage[];
  files?: Record<string, string>;
  model?: string;
}

interface AskEdit {
  path: string;
  content: string;
}

interface AskResponse {
  explanation: string;
  edits: AskEdit[];
  model: string;
}

/** Concatenate files (path-headed) up to the char budget; note what's dropped. */
function buildContext(files: Record<string, string>): {
  body: string;
  omitted: string[];
} {
  const parts: string[] = [];
  const omitted: string[] = [];
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
    const slice =
      content.length > remaining
        ? `${content.slice(0, remaining)}\n…(truncated)…`
        : content;
    parts.push(header + slice);
    used += header.length + slice.length;
  }

  return { body: parts.join("\n"), omitted };
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
    if (
      item &&
      typeof item === "object" &&
      typeof (item as AskEdit).path === "string" &&
      typeof (item as AskEdit).content === "string" &&
      (item as AskEdit).path.trim() !== ""
    ) {
      edits.push({
        path: (item as AskEdit).path.trim(),
        content: (item as AskEdit).content,
      });
    }
  }
  return edits;
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

  const { body: context, omitted } = buildContext(files);
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
        max_tokens: 4096,
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
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

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

    return NextResponse.json({
      explanation,
      edits: parseEdits(parsed),
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

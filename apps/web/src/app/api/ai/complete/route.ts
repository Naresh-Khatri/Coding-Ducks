import { NextResponse } from "next/server";

import { getSession } from "~/auth/server";
import { env } from "~/env";

// La Plateforme fill-in-the-middle endpoint. Uses a general Mistral API key
// (api.mistral.ai), as opposed to the codestral.mistral.ai endpoint which needs
// a separate Codestral-specific key.
const CODESTRAL_FIM_URL = "https://api.mistral.ai/v1/fim/completions";

// Cap the context shipped upstream — keeps latency and token cost in check.
// Completions only need nearby code, not the whole file.
const MAX_CONTEXT_CHARS = 4000;

interface CompletionBody {
  prefix?: string;
  suffix?: string;
}

export async function POST(req: Request) {
  // Gate the endpoint so it can't be used anonymously to burn the key.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = env.MISTRAL_API_KEY;
  if (!apiKey) {
    // Not configured — degrade to "no completion", but say so for debugging.
    return NextResponse.json({
      completion: "",
      reason: "MISTRAL_API_KEY is not set (check .env + restart dev server)",
    });
  }

  let body: CompletionBody;
  try {
    body = (await req.json()) as CompletionBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const prefix = (typeof body.prefix === "string" ? body.prefix : "").slice(
    -MAX_CONTEXT_CHARS,
  );
  const suffix = (typeof body.suffix === "string" ? body.suffix : "").slice(
    0,
    MAX_CONTEXT_CHARS,
  );
  if (!prefix && !suffix) return NextResponse.json({ completion: "" });

  try {
    const upstream = await fetch(CODESTRAL_FIM_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "codestral-latest",
        prompt: prefix,
        suffix,
        max_tokens: 64,
        temperature: 0,
        // Keep completions to a tight burst rather than rambling.
        stop: ["\n\n"],
      }),
    });

    if (!upstream.ok) {
      console.warn(
        "[ai-complete] codestral error",
        upstream.status,
        await upstream.text(),
      );
      return NextResponse.json({
        completion: "",
        reason: `codestral ${upstream.status}`,
      });
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const completion = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ completion });
  } catch (err) {
    console.warn("[ai-complete] request failed", err);
    return NextResponse.json({
      completion: "",
      reason: "request to codestral failed",
    });
  }
}

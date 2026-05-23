import { createHmac, timingSafeEqual } from "node:crypto";

export type CollabRole = "owner" | "editor" | "viewer";

export interface CollabTokenPayload {
  userId: string;
  username: string;
  duckletId: number;
  role: CollabRole;
  exp: number;
}

const DOMAIN = "ducklet-collab-v1";

function deriveKey(rootSecret: string): Buffer {
  if (!rootSecret) {
    throw new Error(
      "Collab token secret is missing. Set BETTER_AUTH_SECRET in your environment.",
    );
  }
  return createHmac("sha256", rootSecret).update(DOMAIN).digest();
}

function hmac(key: Buffer, payload: string): Buffer {
  return createHmac("sha256", key).update(payload).digest();
}

export function signCollabToken(
  payload: CollabTokenPayload,
  rootSecret: string,
): string {
  const key = deriveKey(rootSecret);
  const payloadStr = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = hmac(key, payloadStr).toString("base64url");
  return `${payloadStr}.${sig}`;
}

export function verifyCollabToken(
  token: string,
  rootSecret: string,
): CollabTokenPayload | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, sigStr] = parts as [string, string];

  const key = deriveKey(rootSecret);
  const expectedSig = hmac(key, payloadStr);

  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigStr, "base64url");
  } catch {
    return null;
  }
  if (expectedSig.length !== providedSig.length) return null;
  if (!timingSafeEqual(expectedSig, providedSig)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (
    typeof p.userId !== "string" ||
    typeof p.username !== "string" ||
    typeof p.duckletId !== "number" ||
    typeof p.exp !== "number" ||
    (p.role !== "owner" && p.role !== "editor" && p.role !== "viewer")
  ) {
    return null;
  }
  if (p.exp * 1000 < Date.now()) return null;

  return {
    userId: p.userId,
    username: p.username,
    duckletId: p.duckletId,
    role: p.role,
    exp: p.exp,
  };
}

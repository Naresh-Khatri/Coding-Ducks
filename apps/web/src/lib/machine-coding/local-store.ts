"use client";

/**
 * Anonymous practice state lives in the browser: code in IndexedDB (via
 * y-indexeddb on the solve page) and lightweight attempt metadata in
 * localStorage here. Signing in mirrors the same state to the DB, but anonymous
 * users never hit the server. All helpers are SSR-safe (no-op without `window`).
 */

export type LocalAttemptStatus = "in-progress" | "completed" | "revealed";

export interface LocalAttemptMeta {
  /** Epoch ms when the attempt started — drives the countdown. */
  startedAt: number;
  completed?: boolean;
  revealed?: boolean;
  testsPassed?: number;
  testsTotal?: number;
}

const PREFIX = "machine-coding:meta:";
const key = (slug: string) => `${PREFIX}${slug}`;

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readLocalAttempt(slug: string): LocalAttemptMeta | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key(slug));
    return raw ? (JSON.parse(raw) as LocalAttemptMeta) : null;
  } catch {
    return null;
  }
}

export function writeLocalAttempt(slug: string, meta: LocalAttemptMeta): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(meta));
  } catch {
    // ignore quota / privacy-mode failures
  }
}

/** Merge a partial update into the stored meta, creating it if missing. */
export function patchLocalAttempt(
  slug: string,
  patch: Partial<LocalAttemptMeta>,
): LocalAttemptMeta {
  const current = readLocalAttempt(slug) ?? { startedAt: Date.now() };
  const next = { ...current, ...patch };
  writeLocalAttempt(slug, next);
  return next;
}

export function clearLocalAttempt(slug: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    // ignore
  }
}

export function deriveLocalStatus(
  meta: LocalAttemptMeta | null,
): LocalAttemptStatus | null {
  if (!meta) return null;
  if (meta.completed) return "completed";
  if (meta.revealed) return "revealed";
  return "in-progress";
}

/** Map of slug → status for every locally-tracked attempt (catalogue badges). */
export function readAllLocalStatuses(): Record<string, LocalAttemptStatus> {
  if (!hasStorage()) return {};
  const out: Record<string, LocalAttemptStatus> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const slug = k.slice(PREFIX.length);
      const status = deriveLocalStatus(readLocalAttempt(slug));
      if (status) out[slug] = status;
    }
  } catch {
    return out;
  }
  return out;
}

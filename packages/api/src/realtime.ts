// In-process realtime bus for ducklet events, streamed to clients over SSE.
// Publisher (mutations) and subscriber (ducklet.onEvent) share one Next.js
// process, so the whole backplane is a plain EventEmitter — no broker, no hop.
// Single-instance only: to scale out, swap the emitter for a cross-process bus
// (Postgres LISTEN/NOTIFY or Redis) keeping this publish/subscribe surface.

import { EventEmitter, on } from "node:events";

// Wire shape of a pushed chat message; mirrors a `chatHistory` item.
// `createdAt` is epoch millis so it survives plain JSON.
export interface ChatMessageDTO {
  id: string;
  duckletId: number;
  userId: string | null;
  username: string;
  photoURL: string | null;
  content: string;
  createdAt: number;
}

export type DuckletRealtimeEvent =
  | { type: "members:changed"; duckletId: number }
  | { type: "visibility:changed"; duckletId: number; isPublic: boolean }
  | { type: "chat:message"; duckletId: number; message: ChatMessageDTO };

const CHANNEL = "ducklet-event";

// On globalThis so dev HMR reuses one emitter instead of orphaning listeners.
const globalForRealtime = globalThis as unknown as {
  __duckletRealtimeEmitter?: EventEmitter;
};

const emitter = (globalForRealtime.__duckletRealtimeEmitter ??=
  new EventEmitter());
// One listener per subscription. 0 = unlimited (skip the leak warning).
emitter.setMaxListeners(0);

export function publishDuckletEvent(event: DuckletRealtimeEvent): void {
  emitter.emit(CHANNEL, event);
}

/**
 * Stream one ducklet's events for a tRPC subscription. `on()` drops the
 * listener when `signal` aborts (client disconnect) and throws AbortError —
 * we swallow it so the generator just ends.
 */
export async function* subscribeDuckletEvents(
  duckletId: number,
  signal: AbortSignal | undefined,
): AsyncGenerator<DuckletRealtimeEvent> {
  try {
    for await (const [event] of on(emitter, CHANNEL, { signal })) {
      const e = event as DuckletRealtimeEvent;
      if (e.duckletId === duckletId) yield e;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    throw err;
  }
}

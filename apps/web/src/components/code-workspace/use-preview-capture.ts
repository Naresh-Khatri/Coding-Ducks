"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";

import { getFilesMap } from "@acme/ducklet-fs";

import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";
import { useTRPC } from "~/trpc/react";

// Capture once the project has settled after a burst of edits, throttled so we
// never spam R2. Tuned to represent a meaningfully-changed, settled state.
const MIN_CHANGES = 5; // edits since the last shot before we bother
const IDLE_MS = 10_000; // wait for the editor to go quiet
const COOLDOWN_MS = 120_000; // at most one automatic upload per 2 min
const INITIAL_CAPTURE_DELAY_MS = 4_000; // settle time after the preview boots

// OG image dimensions (1.91:1); also serves as the gallery thumbnail.
const CAPTURE = {
  width: 1200,
  height: 630,
  format: "jpeg",
  quality: 0.82,
} as const;

interface Options {
  ydoc: Y.Doc;
  provider: HocuspocusProvider | null;
  runtime: WebContainerRuntime;
  roomId: number;
  /** Only run for editable sessions (skips read-only guests). */
  enabled: boolean;
}

/**
 * Auto-captures the live preview and persists it as the room's preview
 * image (gallery thumbnail + OG image). To stop every collaborator uploading
 * the same shot, only the awareness "leader" — the lowest connected clientId —
 * performs captures.
 */
export function useRoomPreviewCapture({
  ydoc,
  provider,
  runtime,
  roomId,
  enabled,
}: Options): void {
  const trpc = useTRPC();
  const { mutateAsync } = useMutation(
    trpc.room.updatePreviewImage.mutationOptions(),
  );

  // Latest values in refs so the observer effect can stay mounted for the whole
  // session instead of re-subscribing on every render.
  const runtimeRef = useRef(runtime);
  const mutateRef = useRef(mutateAsync);
  runtimeRef.current = runtime;
  mutateRef.current = mutateAsync;

  // Shared trigger state, persisted across renders.
  const changesRef = useRef(0);
  const lastCaptureAtRef = useRef(0);
  const capturingRef = useRef(false);
  const initialCaptureDoneRef = useRef(false);

  // We capture if we're the lowest clientId among connected peers (stable as
  // long as that peer stays), so exactly one client uploads.
  const amLeader = useCallback((): boolean => {
    const awareness = provider?.awareness;
    if (!awareness) return false;
    const ids = [...awareness.getStates().keys()];
    return ids.length === 0 || awareness.clientID === Math.min(...ids);
  }, [provider]);

  // Gating (enough changes / cooldown) is the caller's job; this just performs
  // a capture + upload when allowed (editable, leader, preview up).
  const performCapture = useCallback(
    async (): Promise<void> => {
      if (capturingRef.current) return;
      if (!enabled || !amLeader()) return;
      if (!runtimeRef.current.previewUrl) return; // dev server not up yet

      capturingRef.current = true;
      try {
        const dataUrl = await runtimeRef.current.capture(CAPTURE);
        const base64 = dataUrl.split(",")[1];
        if (!base64) throw new Error("empty capture");
        await mutateRef.current({
          roomId,
          image: base64,
          contentType: "image/jpeg",
        });
        lastCaptureAtRef.current = Date.now();
        changesRef.current = 0;
      } finally {
        capturingRef.current = false;
      }
    },
    [enabled, amLeader, roomId],
  );

  // First shot once the preview boots, so a thumbnail appears without any edits.
  const previewUrl = runtime.previewUrl;
  useEffect(() => {
    if (!enabled || !previewUrl || initialCaptureDoneRef.current) return;

    const timer = setTimeout(() => {
      initialCaptureDoneRef.current = true;
      void performCapture().catch((err) => {
        initialCaptureDoneRef.current = false; // retry on next preview-url change
        console.warn("[room] initial preview capture failed:", err);
      });
    }, INITIAL_CAPTURE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, previewUrl, performCapture]);

  // Debounced auto-capture: fire after the editor goes quiet, once enough has
  // changed and the cooldown has elapsed.
  useEffect(() => {
    if (!enabled || !provider) return;

    const filesMap = getFilesMap(ydoc);
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const tryCapture = () => {
      if (changesRef.current < MIN_CHANGES) return;
      const sinceLast = Date.now() - lastCaptureAtRef.current;
      if (sinceLast < COOLDOWN_MS) {
        // Too soon — retry once the cooldown clears.
        clearTimeout(idleTimer);
        idleTimer = setTimeout(tryCapture, COOLDOWN_MS - sinceLast);
        return;
      }
      void performCapture().catch((err) => {
        // Leave `changes` intact so the next idle window retries.
        console.warn("[room] preview capture failed:", err);
      });
    };

    const onChange = () => {
      changesRef.current += 1;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(tryCapture, IDLE_MS);
    };

    filesMap.observeDeep(onChange);
    return () => {
      clearTimeout(idleTimer);
      filesMap.unobserveDeep(onChange);
    };
  }, [enabled, provider, ydoc, performCapture]);
}

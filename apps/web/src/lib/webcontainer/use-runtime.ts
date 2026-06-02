"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import type * as Y from "yjs";

import {
  getDirsMap,
  getFilesMap,
  readAllFiles,
  writeFile as writeYjsFile,
} from "@acme/ducklet-fs";

import { bootWebContainer, teardownWebContainer } from "./boot";
import { inferBootPlan, isIgnoredPath, toFileSystemTree } from "./tree";

export type RuntimeStatus =
  | "idle"
  | "booting"
  | "mounting"
  | "running"
  | "error";

export interface WebContainerRuntime {
  status: RuntimeStatus;
  /** URL of the dev server once it's up (from the `server-ready` event). */
  previewUrl: string | null;
  error: string | null;
  /** Subscribe to shell output; replays buffered output first. Returns unsub. */
  subscribeOutput: (cb: (data: string) => void) => () => void;
  /** Forward terminal keystrokes into the shell. */
  writeInput: (data: string) => void;
  /** Resize the shell's pty. */
  resize: (cols: number, rows: number) => void;
  /** Re-run the inferred boot command (Ctrl-C then start). */
  restart: () => void;
}

/**
 * Owns the per-tab WebContainer for a ducklet: boots it, mounts the Yjs file
 * tree, keeps Yjs and the container filesystem in sync both ways, runs an
 * interactive shell, and surfaces the dev-server URL.
 *
 * Sync is loop-safe via a `fsShadow` map (the last content we know is on disk
 * for each path): neither direction re-writes content that already matches.
 */
export function useWebContainerRuntime({
  ydoc,
  enabled,
}: {
  ydoc: Y.Doc;
  enabled: boolean;
}): WebContainerRuntime {
  const [status, setStatus] = useState<RuntimeStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputWriterRef = useRef<WritableStreamDefaultWriter<string> | null>(
    null,
  );
  const shellRef = useRef<WebContainerProcess | null>(null);
  const bootCommandRef = useRef<string | null>(null);

  // Shell output fan-out with a replay buffer for late subscribers (xterm
  // mounts slightly after the shell starts).
  const outputBufferRef = useRef<string[]>([]);
  const listenersRef = useRef<Set<(data: string) => void>>(new Set());

  const subscribeOutput = useCallback((cb: (data: string) => void) => {
    for (const chunk of outputBufferRef.current) cb(chunk);
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  const writeInput = useCallback((data: string) => {
    void inputWriterRef.current?.write(data);
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    shellRef.current?.resize({ cols, rows });
  }, []);

  const restart = useCallback(() => {
    const cmd = bootCommandRef.current;
    if (!cmd) return;
    // Ctrl-C to stop the current dev server, then re-run.
    writeInput("");
    writeInput(`${cmd}\n`);
  }, [writeInput]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    // Last content we believe is on disk for each path — the loop-breaker.
    const fsShadow = new Map<string, string>();
    const filesMap = getFilesMap(ydoc);
    let stopObserving: (() => void) | null = null;

    const emit = (data: string) => {
      const buf = outputBufferRef.current;
      buf.push(data);
      if (buf.length > 2000) buf.shift();
      for (const l of listenersRef.current) l(data);
    };

    const start = async () => {
      try {
        setStatus("booting");
        const container = await bootWebContainer();
        if (cancelled) return;

        container.on("server-ready", (_port, url) => {
          if (!cancelled) setPreviewUrl(url);
        });

        setStatus("mounting");
        const initialFiles = readAllFiles(ydoc);
        const dirs = [...getDirsMap(ydoc).keys()];
        await container.mount(toFileSystemTree(initialFiles, dirs));
        if (cancelled) return;

        // Seed the shadow so we never re-write the files we just mounted.
        for (const [path, content] of Object.entries(initialFiles)) {
          fsShadow.set(path, content);
        }

        stopObserving = wireSync(container, ydoc, filesMap, fsShadow, cancelled);

        // Interactive shell wired to xterm via the output fan-out.
        const shell = await container.spawn("jsh", {
          terminal: { cols: 80, rows: 24 },
        });
        if (cancelled) {
          shell.kill();
          return;
        }
        shellRef.current = shell;
        inputWriterRef.current = shell.input.getWriter();
        void shell.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!cancelled) emit(data);
            },
          }),
        );

        // Kick off install + dev server if the project is runnable.
        const plan = inferBootPlan(initialFiles);
        if (plan) {
          bootCommandRef.current = plan.command;
          void inputWriterRef.current.write(`${plan.command}\n`);
        }

        setStatus("running");
      } catch (err) {
        if (cancelled) return;
        console.error("[ducklet] runtime failed:", err);
        setError(err instanceof Error ? err.message : "Runtime failed to start");
        setStatus("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopObserving?.();
      shellRef.current?.kill();
      shellRef.current = null;
      inputWriterRef.current = null;
      outputBufferRef.current = [];
      void teardownWebContainer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ydoc]);

  return {
    status,
    previewUrl,
    error,
    subscribeOutput,
    writeInput,
    resize,
    restart,
  };
}

/**
 * Wire bidirectional sync between the Yjs `files` map and the container fs.
 * Returns a teardown that detaches both observers.
 */
function wireSync(
  container: WebContainer,
  ydoc: Y.Doc,
  filesMap: Y.Map<Y.Text>,
  fsShadow: Map<string, string>,
  cancelledRef: boolean,
): () => void {
  // Yjs → fs, debounced per path so a burst of keystrokes is one write.
  const dirty = new Set<string>();
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Per-path serialized write queue. Writes to the same path are chained so
  // they can't reorder (which would leave stale content on disk), and a path
  // stays in `writing` from the moment we enqueue until its last write settles.
  // The fs→Yjs watcher uses `writing` to ignore the disk churn we cause
  // ourselves — see the watcher comment below.
  const writeQueue = new Map<string, Promise<void>>();
  const writing = new Set<string>();

  const enqueueFsWrite = (path: string, op: () => Promise<void>) => {
    writing.add(path);
    const prev = writeQueue.get(path) ?? Promise.resolve();
    const next = prev
      .catch(() => undefined)
      .then(op)
      .finally(() => {
        // Only the last write in the chain clears the flags.
        if (writeQueue.get(path) === next) {
          writeQueue.delete(path);
          writing.delete(path);
        }
      });
    writeQueue.set(path, next);
  };

  const flush = () => {
    flushTimer = null;
    for (const path of dirty) {
      const text = filesMap.get(path);
      if (!text) {
        // Deleted in Yjs → remove from fs.
        fsShadow.delete(path);
        enqueueFsWrite(path, () =>
          container.fs
            .rm(path, { force: true, recursive: true })
            .catch(() => undefined),
        );
        continue;
      }
      const content = text.toString();
      if (fsShadow.get(path) === content) continue;
      fsShadow.set(path, content);
      enqueueFsWrite(path, () => writeToContainer(container, path, content));
    }
    dirty.clear();
  };

  // Trailing debounce: reset on each change so the container fs (and thus the
  // dev server's HMR / preview) only updates once the user pauses typing,
  // rather than repeatedly mid-keystroke.
  const FLUSH_DEBOUNCE_MS = 300;
  const scheduleFlush = () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
  };

  const findPath = (target: unknown): string | undefined => {
    for (const [path, text] of filesMap) {
      if (text === target) return path;
    }
    return undefined;
  };

  const onYjs = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
    for (const event of events) {
      if (event.target === filesMap) {
        for (const [key] of event.changes.keys) dirty.add(key);
      } else {
        const path = findPath(event.target);
        if (path) dirty.add(path);
      }
    }
    scheduleFlush();
  };
  filesMap.observeDeep(onYjs);

  // fs → Yjs: pick up files created/changed by the shell (scaffolds,
  // lockfiles, generated source). node_modules etc. are ignored.
  const watcher = container.fs.watch(
    ".",
    { recursive: true },
    (_event, filename) => {
      if (cancelledRef) return;
      if (typeof filename !== "string" || isIgnoredPath(filename)) return;
      // While our own Yjs→fs write for this path is in flight the disk is
      // mid-transition: a read here can return the *previous* content (the
      // write hasn't landed yet) or the new one. Acting on that stale read
      // would write outdated text back into the Y.Text the user is typing in,
      // clobbering it and snapping every collaborator's cursor to the top. Skip
      // it — once the write settles, disk matches the shadow and the guard
      // below correctly ignores the echo.
      if (writing.has(filename)) return;
      void container.fs
        .readFile(filename, "utf-8")
        .then((content) => {
          // Re-check: a write may have started between the watch event and this
          // async read resolving.
          if (writing.has(filename)) return;
          // Echo of our own Yjs→fs write (shadow already holds this content),
          // or a change we've already absorbed: ignore it.
          if (fsShadow.get(filename) === content) return;
          fsShadow.set(filename, content);
          const text = filesMap.get(filename);
          if (!text || text.toString() !== content) {
            writeYjsFile(ydoc, filename, content);
          }
        })
        .catch(() => undefined); // deleted or binary — skip
    },
  );

  return () => {
    filesMap.unobserveDeep(onYjs);
    if (flushTimer) clearTimeout(flushTimer);
    watcher.close();
  };
}

async function writeToContainer(
  container: WebContainer,
  path: string,
  content: string,
): Promise<void> {
  try {
    const slash = path.lastIndexOf("/");
    if (slash > 0) {
      await container.fs.mkdir(path.slice(0, slash), { recursive: true });
    }
    await container.fs.writeFile(path, content);
  } catch (err) {
    console.error(`[ducklet] failed writing ${path}:`, err);
  }
}

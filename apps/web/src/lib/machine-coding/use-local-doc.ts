"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

import {
  getFileText,
  isEmptyProject,
  seedFiles,
  writeFile,
} from "@acme/ducklet-fs";

import { clearLocalAttempt } from "./local-store";

/**
 * Owns the per-slug local practice document: a `Y.Doc` persisted in IndexedDB so
 * an anonymous learner's code survives reloads. Seeds the starter files the
 * first time (when the store is empty), then resumes thereafter. No websocket,
 * no server — the editable counterpart of the read-only guest doc.
 */
export function useLocalMachineCodingDoc(
  slug: string,
  files: Record<string, string> | undefined,
  /**
   * Paths the learner owns. On resume, every *other* seeded file (tests,
   * config, harness) is refreshed to the latest starter content so content
   * updates reach in-progress attempts — without touching these. Omit to skip
   * the refresh entirely (resume as-is).
   */
  editablePaths?: string[] | null,
) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [ready, setReady] = useState(false);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);

  // Read `files` through a ref so the init effect re-runs only when files first
  // arrive (or the slug changes) — not on every query re-render. The ref is
  // updated in an effect (never during render).
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const editablePathsRef = useRef(editablePaths);
  useEffect(() => {
    editablePathsRef.current = editablePaths;
  }, [editablePaths]);
  const hasFiles = !!files;

  useEffect(() => {
    if (!hasFiles) return;
    const startFiles = filesRef.current;
    if (!startFiles) return;

    let cancelled = false;
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`machine-coding:${slug}`, doc);
    persistenceRef.current = persistence;

    void persistence.whenSynced.then(() => {
      if (cancelled) return;
      if (isEmptyProject(doc)) {
        seedFiles(doc, startFiles);
      } else if (editablePathsRef.current) {
        // Resume: refresh non-editable scaffolding (tests, vitest config, the
        // mc-test harness) to the latest content so an in-progress attempt
        // picks up content updates — but never overwrite the learner's code.
        const editable = new Set(editablePathsRef.current);
        for (const [path, content] of Object.entries(startFiles)) {
          if (editable.has(path)) continue;
          if (getFileText(doc, path)?.toJSON() !== content) {
            writeFile(doc, path, content);
          }
        }
      }
      setYdoc(doc);
      setReady(true);
    });

    return () => {
      cancelled = true;
      setReady(false);
      setYdoc(null);
      persistenceRef.current = null;
      void persistence.destroy();
      doc.destroy();
    };
  }, [slug, hasFiles]);

  /** Wipe the saved code + attempt meta and reload to reseed from the starter. */
  const reset = useCallback(async () => {
    clearLocalAttempt(slug);
    try {
      await persistenceRef.current?.clearData();
    } catch {
      // ignore — reload reseeds anyway
    }
    if (typeof window !== "undefined") window.location.reload();
  }, [slug]);

  return { ydoc, ready, reset };
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor as MEditor } from "monaco-editor";
import type * as Y from "yjs";

import { getFilesMap } from "@acme/ducklet-fs";

import { monacoLanguage } from "./lang";

export interface DuckletModels {
  /** Get (creating if missing) the Monaco model for a file path. */
  get: (path: string) => MEditor.ITextModel | null;
}

/**
 * Maintains a Monaco text model for every file in the ducklet's Yjs doc, under
 * `file:///<path>` URIs that match import specifiers — this is what gives the
 * TS language service cross-file resolution, go-to-definition and auto-imports
 * from sibling modules.
 *
 * The *active* editor's model is owned by its `MonacoBinding` (see
 * `file-editor.tsx`), which keeps it byte-for-byte equal to the Y.Text. The
 * background models here are kept in sync straight from Yjs with a
 * value-compare guard, so the write below no-ops for the bound model and never
 * clobbers the user's cursor/undo. Mirrors the debounced observeDeep pattern in
 * `lib/webcontainer/use-runtime.ts:wireSync`.
 */
export function useDuckletModels({
  monaco,
  ydoc,
}: {
  monaco: Monaco | null;
  ydoc: Y.Doc;
}): { models: DuckletModels | null; ready: boolean } {
  const [ready, setReady] = useState(false);
  const managerRef = useRef<DuckletModels | null>(null);

  // setReady(true) on setup and setReady(false) in cleanup are a single flag
  // managed by this effect; they do not cascade into further state updates.
  useEffect(() => {
    if (!monaco) return;

    const filesMap = getFilesMap(ydoc);
    const uriFor = (path: string) => monaco.Uri.parse(`file:///${path}`);

    const ensure = (path: string): MEditor.ITextModel => {
      const uri = uriFor(path);
      const existing = monaco.editor.getModel(uri);
      if (existing) return existing;
      const text = filesMap.get(path);
      return monaco.editor.createModel(
        text ? text.toJSON() : "",
        monacoLanguage(path),
        uri,
      );
    };

    // Seed a model for every current file so the TS worker sees the whole
    // project up front (cross-file types + auto-import candidates).
    for (const path of filesMap.keys()) ensure(path);

    const findPath = (target: unknown): string | undefined => {
      for (const [path, text] of filesMap) if (text === target) return path;
      return undefined;
    };

    const dirty = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      for (const path of dirty) {
        const text = filesMap.get(path);
        const model = monaco.editor.getModel(uriFor(path));
        if (!text) {
          model?.dispose();
          continue;
        }
        if (!model) {
          ensure(path);
          continue;
        }
        const content = text.toJSON();
        if (model.getValue() !== content) model.setValue(content);
      }
      dirty.clear();
    };

    const onChange = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
      for (const event of events) {
        if (event.target === filesMap) {
          for (const [key] of event.changes.keys) dirty.add(key);
        } else {
          const path = findPath(event.target);
          if (path) dirty.add(path);
        }
      }
      timer ??= setTimeout(flush, 100);
    };
    filesMap.observeDeep(onChange);

    managerRef.current = { get: (path) => ensure(path) };
    // Signals that Monaco models have been built for the doc; this is a
    // one-time setup completion flag, not state mirrored from a prop.
    setReady(true);

    return () => {
      filesMap.unobserveDeep(onChange);
      if (timer) clearTimeout(timer);
      for (const model of monaco.editor.getModels()) {
        if (model.uri.scheme === "file") model.dispose();
      }
      managerRef.current = null;
      setReady(false);
    };
  }, [monaco, ydoc]);

  return { models: managerRef.current, ready };
}

"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";
import { useCallback, useEffect, useMemo, useState } from "react";
// Monaco is loaded once via a pinned CDN loader (see ./monaco/setup) and shared
// across the whole workspace — it isn't a route-level chunk to defer.
import { useMonaco } from "@monaco-editor/react";
import { TerminalIcon } from "lucide-react";
import { useTheme } from "next-themes";

import {
  getFileText,
  listFilePaths,
  readAllFiles,
  writeFile,
} from "@acme/ducklet-fs";

import { EditorSettingsDialog } from "~/components/editor-settings-dialog";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useEditorSettings } from "~/hooks/use-editor-settings";
import { useFilePresence } from "~/lib/webcontainer/use-file-presence";
import { useWebContainerRuntime } from "~/lib/webcontainer/use-runtime";

import "./monaco/setup";

import type { AskProposal } from "./use-ask-chat";
import { AskDock } from "./ask-dock";
import { ConsolePanel, ConsoleToggleButton } from "./console-panel";
import { EditorTabs } from "./editor-tabs";
import { FileExplorer } from "./file-explorer";
import { FileEditor } from "./monaco/file-editor";
import { ReviewEditor } from "./monaco/review-editor";
import { useAiInlineCompletion } from "./monaco/use-ai-inline-completion";
import { useDuckletModels } from "./monaco/use-models";
import { useNodeModulesTypes } from "./monaco/use-node-modules-types";
import { useTsDefaults } from "./monaco/use-ts-defaults";
import { PreviewPanel } from "./preview-panel";
import { TerminalPanel } from "./terminal-panel";
import { useAskChat } from "./use-ask-chat";
import { useIframeFocusGuard } from "./use-iframe-focus-guard";
import { useDuckletPreviewCapture } from "./use-preview-capture";

/** A locally-held AI edit proposal awaiting review (never written to the doc). */
interface PendingEdit {
  /** Proposed file contents. */
  proposed: string;
  /** File contents when proposed — the diff baseline + stale check. */
  base: string;
  isNew: boolean;
}

/** Normalized dependency fingerprint of a package.json, or null if unparseable. */
function depFingerprint(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const norm = (o?: Record<string, string>) =>
      Object.entries(o ?? {}).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify([norm(pkg.dependencies), norm(pkg.devDependencies)]);
  } catch {
    return null;
  }
}

/** Whether dependencies/devDependencies differ between two package.json texts. */
function packageDepsChanged(base: string | undefined, next: string): boolean {
  const after = depFingerprint(next);
  if (after === null) return false; // proposed file isn't valid JSON — skip.
  return depFingerprint(base) !== after;
}

interface WorkspaceProps {
  /** Null for the read-only guest view (no collaboration / presence). */
  provider: HocuspocusProvider | null;
  ydoc: Y.Doc;
  readOnly?: boolean;
  /** Numeric ducklet id — enables auto preview-image capture when editable. */
  duckletId?: number;
}

const ENTRY_CANDIDATES = [
  "src/App.tsx",
  "src/App.jsx",
  "src/main.tsx",
  "src/main.jsx",
  "src/main.ts",
  "src/main.js",
  "index.html",
  "server.js",
  "README.md",
];

function pickDefaultFile(ydoc: Y.Doc): string | null {
  const files = listFilePaths(ydoc);
  const fileSet = new Set(files);
  for (const candidate of ENTRY_CANDIDATES) {
    if (fileSet.has(candidate)) return candidate;
  }
  // Fall back to the alphabetically first file (single pass, no full sort).
  let first: string | null = null;
  for (const f of files) {
    if (first === null || f < first) first = f;
  }
  return first;
}

export function Workspace({
  provider,
  ydoc,
  readOnly = false,
  duckletId,
}: WorkspaceProps) {
  const runtime = useWebContainerRuntime({ ydoc, enabled: true });
  const { byPath: presenceByPath, setActiveFile } = useFilePresence(provider);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Keep the preview iframe (e.g. a Next.js error overlay) from stealing the
  // caret out of the editor while the user is typing.
  useIframeFocusGuard();

  // Auto-capture the preview as the ducklet's thumbnail / OG image (editable
  // sessions only; one uploader per room via awareness leader election).
  const editable = !readOnly && !!provider && duckletId != null;
  useDuckletPreviewCapture({
    ydoc,
    provider,
    runtime,
    duckletId: duckletId ?? 0,
    enabled: editable,
  });

  // Monaco (loaded once via the pinned CDN loader) powers TS intelligence,
  // collaboration and AI completion. Its hooks live at the workspace level so
  // one language service + model set is shared across all open files.
  const monaco = useMonaco();
  const { aiCompletion, tsIntelligence } = useEditorSettings();
  const { models, ready: modelsReady } = useDuckletModels({ monaco, ydoc });
  useTsDefaults({ monaco, ydoc, enabled: tsIntelligence });
  // Mirror the real installed node_modules .d.ts into Monaco once `npm install`
  // finishes — the editor's source of truth for dependency types.
  useNodeModulesTypes({
    monaco,
    container: runtime.container,
    enabled: tsIntelligence,
  });
  useAiInlineCompletion({ monaco, enabled: !!provider && aiCompletion });

  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  // Collapsed by default — diffs reviewed in the editor want the vertical room.
  const [showTerminal, setShowTerminal] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  // Pending AI edits keyed by path. Local-only: a proposal is written to the
  // shared doc only when the user accepts it, never on arrival.
  const [pending, setPending] = useState<Record<string, PendingEdit>>({});
  const pendingPaths = useMemo(() => new Set(Object.keys(pending)), [pending]);

  // Open a sensible entry file on first load. Initializes the editor from the
  // external Y.Doc (and re-runs if the doc identity changes), so it must be an
  // effect rather than render-time derived state.
  useEffect(() => {
    const initial = pickDefaultFile(ydoc);
    if (initial) {
      setOpenPaths([initial]);
      setActivePath(initial);
    }
  }, [ydoc]);

  // Publish which file we're viewing to the external Yjs awareness store so
  // peers see our avatar on it — a side effect synced on selection change.
  useEffect(() => {
    setActiveFile(activePath);
  }, [activePath, setActiveFile]);

  const openFile = useCallback((path: string) => {
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActivePath(path);
  }, []);

  const closeFile = useCallback(
    (path: string) => {
      setOpenPaths((prev) => {
        const next = prev.filter((p) => p !== path);
        if (activePath === path) {
          setActivePath(next[next.length - 1] ?? null);
        }
        return next;
      });
    },
    [activePath],
  );

  // Register a batch of AI-proposed edits as pending diffs and jump to the first
  // one. Baselines are read from a single snapshot so the diff "before" matches
  // what we sent the model. Nothing is written to the doc here.
  const registerProposal = useCallback(
    (edits: AskProposal[]) => {
      if (edits.length === 0) return;
      const snapshot = readAllFiles(ydoc);
      setPending((prev) => {
        const next = { ...prev };
        for (const e of edits) {
          const base = snapshot[e.path];
          next[e.path] = {
            proposed: e.content,
            base: base ?? "",
            isNew: base === undefined,
          };
        }
        return next;
      });
      const first = edits[0]?.path;
      if (first) openFile(first);
    },
    [ydoc, openFile],
  );

  const dropPending = useCallback((path: string) => {
    setPending((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const chat = useAskChat({ ydoc, onProposal: registerProposal });

  const acceptEdit = useCallback(
    (path: string, content: string) => {
      // A package.json dependency change needs a reinstall + dev-server restart
      // to take effect; check against the baseline before clearing it.
      const depsChanged =
        path === "package.json" &&
        packageDepsChanged(pending[path]?.base, content);
      writeFile(ydoc, path, content);
      dropPending(path);
      if (depsChanged) {
        runtime.reinstall();
        chat.notify(
          "package.json dependencies changed — stopping the dev server, running npm install, and restarting.",
        );
      }
    },
    [ydoc, dropPending, pending, runtime, chat],
  );

  // Drop tabs whose file was deleted (by anyone).
  useEffect(() => {
    const map = ydoc.getMap("files");
    const check = () => {
      const existing = new Set(listFilePaths(ydoc));
      setOpenPaths((prev) => {
        const next = prev.filter((p) => existing.has(p));
        if (next.length !== prev.length) {
          setActivePath((cur) =>
            cur && existing.has(cur) ? cur : (next[next.length - 1] ?? null),
          );
        }
        return next;
      });
    };
    map.observe(check);
    return () => map.unobserve(check);
  }, [ydoc]);

  const activeText = activePath ? getFileText(ydoc, activePath) : undefined;
  const activeModel =
    monaco && modelsReady && activePath
      ? (models?.get(activePath) ?? null)
      : null;
  const activePending = activePath ? pending[activePath] : undefined;

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
        <FileExplorer
          ydoc={ydoc}
          readOnly={readOnly}
          activePath={activePath}
          onOpen={openFile}
          presenceByPath={presenceByPath}
          pendingPaths={pendingPaths}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={52} minSize={25}>
        <div className="flex h-full flex-col">
          <EditorTabs
            openPaths={openPaths}
            activePath={activePath}
            onSelect={setActivePath}
            onClose={closeFile}
            presenceByPath={presenceByPath}
            pendingPaths={pendingPaths}
            actions={<EditorSettingsDialog showShortcuts={false} />}
          />

          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={70} minSize={20}>
              <div className="relative h-full">
                {!monaco ? (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    Loading editor…
                  </div>
                ) : activePath && activePending ? (
                  <ReviewEditor
                    key={activePath}
                    path={activePath}
                    base={activePending.base}
                    proposed={activePending.proposed}
                    isNew={activePending.isNew}
                    isDark={isDark}
                    current={activeText?.toJSON() ?? ""}
                    onAccept={acceptEdit}
                    onReject={dropPending}
                  />
                ) : activePath && activeText && activeModel ? (
                  <FileEditor
                    monaco={monaco}
                    model={activeModel}
                    ytext={activeText}
                    provider={provider}
                    readOnly={readOnly}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                    Select a file to start editing
                  </div>
                )}

                {/* Floating AI chat bar overlaid at the bottom of the editor. */}
                {!readOnly && (
                  <AskDock
                    chat={chat}
                    pendingPaths={pendingPaths}
                    onOpenFile={openFile}
                  />
                )}
              </div>
            </ResizablePanel>

            {showTerminal && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={10}>
                  <TerminalPanel runtime={runtime} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>

          <div className="bg-muted/20 flex h-7 items-center gap-1 border-t px-2">
            <Button
              variant={showTerminal ? "secondary" : "ghost"}
              size="sm"
              className="h-5 rounded-xs px-2 text-xs"
              onClick={() => setShowTerminal((v) => !v)}
              title="Toggle terminal"
            >
              <TerminalIcon className="mr-1 size-3" />
              Terminal
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={30} minSize={20}>
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={70} minSize={20}>
            <PreviewPanel
              runtime={runtime}
              consoleToggle={
                <ConsoleToggleButton
                  runtime={runtime}
                  open={showConsole}
                  onToggle={() => setShowConsole((v) => !v)}
                />
              }
            />
          </ResizablePanel>

          {showConsole && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10}>
                <ConsolePanel
                  runtime={runtime}
                  onClose={() => setShowConsole(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

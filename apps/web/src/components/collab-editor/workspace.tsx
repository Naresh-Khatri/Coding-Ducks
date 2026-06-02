"use client";

import { useCallback, useEffect, useState } from "react";
import { useMonaco } from "@monaco-editor/react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { TerminalIcon } from "lucide-react";
import type * as Y from "yjs";

import { getFileText, listFilePaths } from "@acme/ducklet-fs";

import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useEditorSettings } from "~/hooks/use-editor-settings";
import { useFilePresence } from "~/lib/webcontainer/use-file-presence";
import { useWebContainerRuntime } from "~/lib/webcontainer/use-runtime";
import { EditorSettingsDialog } from "~/components/editor-settings-dialog";

import "./monaco/setup";
import { EditorTabs } from "./editor-tabs";
import { FileExplorer } from "./file-explorer";
import { FileEditor } from "./monaco/file-editor";
import { useAiInlineCompletion } from "./monaco/use-ai-inline-completion";
import { useDuckletModels } from "./monaco/use-models";
import { useTsDefaults } from "./monaco/use-ts-defaults";
import { PreviewPanel } from "./preview-panel";
import { TerminalPanel } from "./terminal-panel";

interface WorkspaceProps {
  /** Null for the read-only guest view (no collaboration / presence). */
  provider: HocuspocusProvider | null;
  ydoc: Y.Doc;
  readOnly?: boolean;
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
  for (const candidate of ENTRY_CANDIDATES) {
    if (files.includes(candidate)) return candidate;
  }
  return [...files].sort()[0] ?? null;
}

export function Workspace({ provider, ydoc, readOnly = false }: WorkspaceProps) {
  const runtime = useWebContainerRuntime({ ydoc, enabled: true });
  const { byPath: presenceByPath, setActiveFile } = useFilePresence(provider);

  // Monaco (loaded once via the pinned CDN loader) powers TS intelligence,
  // collaboration and AI completion. Its hooks live at the workspace level so
  // one language service + model set is shared across all open files.
  const monaco = useMonaco();
  const { aiCompletion, tsIntelligence } = useEditorSettings();
  const { models, ready: modelsReady } = useDuckletModels({ monaco, ydoc });
  useTsDefaults({ monaco, ydoc, enabled: tsIntelligence });
  useAiInlineCompletion({ monaco, enabled: !!provider && aiCompletion });

  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);

  // Open a sensible entry file on first load.
  useEffect(() => {
    const initial = pickDefaultFile(ydoc);
    if (initial) {
      setOpenPaths([initial]);
      setActivePath(initial);
    }
  }, [ydoc]);

  // Publish which file we're viewing so peers see our avatar on it.
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
    monaco && modelsReady && activePath ? (models?.get(activePath) ?? null) : null;

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
        <FileExplorer
          ydoc={ydoc}
          readOnly={readOnly}
          activePath={activePath}
          onOpen={openFile}
          presenceByPath={presenceByPath}
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
            actions={<EditorSettingsDialog showShortcuts={false} />}
          />

          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={70} minSize={20}>
              {!monaco ? (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Loading editor…
                </div>
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

          <div className="bg-muted/20 flex h-7 items-center border-t px-2">
            <Button
              variant={showTerminal ? "secondary" : "ghost"}
              size="sm"
              className="h-5 rounded-xs px-2 text-xs"
              onClick={() => setShowTerminal((v) => !v)}
              title="Toggle terminal"
            >
              <TerminalIcon className="mr-1 h-3 w-3" />
              Terminal
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={30} minSize={20}>
        <PreviewPanel runtime={runtime} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

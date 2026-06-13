"use client";

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { ReactNode } from "react";
import type * as Y from "yjs";
import { useCallback, useEffect, useMemo, useState } from "react";
// Monaco is loaded once via a pinned CDN loader (see ./monaco/setup) and shared
// across the whole workspace — it isn't a route-level chunk to defer.
import { useMonaco } from "@monaco-editor/react";
import { ChevronDown, FolderTree, Lock, TerminalIcon } from "lucide-react";
import { useTheme } from "next-themes";

import {
  deleteFile,
  getFileText,
  listFilePaths,
  readAllFiles,
  writeFile,
} from "@acme/ducklet-fs";

import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";
import { EditorSettingsDialog } from "~/components/editor-settings-dialog";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useEditorSettings } from "~/hooks/use-editor-settings";
import { useIsMobile } from "~/hooks/use-is-mobile";
import { cn } from "~/lib/utils";
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
import { useEditorModels } from "./monaco/use-models";
import { useNodeModulesTypes } from "./monaco/use-node-modules-types";
import { useTsDefaults } from "./monaco/use-ts-defaults";
import { PreviewPanel } from "./preview-panel";
import { TerminalPanel } from "./terminal-panel";
import { useAskChat } from "./use-ask-chat";
import { useIframeFocusGuard } from "./use-iframe-focus-guard";
import { useRoomPreviewCapture } from "./use-preview-capture";
import { RuntimeUnavailableBanner } from "./webcontainer-support";

/** A locally-held AI edit proposal awaiting review (never written to the doc). */
interface PendingEdit {
  /** "write" creates/overwrites with `proposed`; "delete" removes the file. */
  kind: "write" | "delete";
  /** Proposed file contents (empty for a delete). */
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

/** Imperative surface a side panel can use to drive the editor. */
export interface WorkspaceApi {
  /** Live WebContainer runtime — spawn commands, read files, preview URL. */
  runtime: WebContainerRuntime;
  /**
   * Load a set of files as reviewable diffs against the current code, reusing
   * the editor's accept/reject flow (e.g. revealing a reference solution).
   */
  loadFilesAsDiff: (files: Record<string, string>) => void;
  /** Snapshot of all current file contents (e.g. to read test sources). */
  readFiles: () => Record<string, string>;
}

/**
 * An optional extra tab + toolbar rendered in the left panel, sitting next to
 * the Files explorer. This is how feature surfaces (a problem statement, docs,
 * a checklist…) plug into the otherwise domain-agnostic editor without the
 * editor knowing anything about them.
 */
export interface WorkspaceSidePanel {
  /** Tab label (the Files tab sits beside it). */
  label: string;
  /** Panel body; receives the workspace API. */
  render: (api: WorkspaceApi) => ReactNode;
  /** Optional element pinned to the right of the tab row (e.g. a timer). */
  toolbar?: ReactNode;
}

/**
 * An optional drawer rendered under the editor (where the terminal sits),
 * toggled from the bottom status bar — e.g. a test-results panel. Like the side
 * panel, this is how a feature plugs a results surface into the generic editor.
 */
export interface WorkspaceBottomPanel {
  /** Toggle label shown in the bottom bar. */
  label: string;
  /** Optional leading icon for the toggle. */
  icon?: ReactNode;
  /** Drawer body; receives the workspace API. */
  render: (api: WorkspaceApi) => ReactNode;
}

interface WorkspaceProps {
  /** Null for non-collaborative editing (local-first or read-only guest view). */
  provider: HocuspocusProvider | null;
  ydoc: Y.Doc;
  readOnly?: boolean;
  /** Numeric ducklet id — enables auto preview-image capture when editable. */
  roomId?: number;
  /** AI ghost-text + Ask dock. Pass `false` for assessment / interview mode. */
  aiEnabled?: boolean;
  /** Optional extra left-panel tab (problem statement, docs…) + toolbar. */
  sidePanel?: WorkspaceSidePanel | null;
  /** Optional drawer under the editor (e.g. test results), open by default. */
  bottomPanel?: WorkspaceBottomPanel | null;
  /**
   * Wraps the workspace content so the side + bottom panels can share state via
   * a feature-owned context (e.g. one test-run state behind both). Receives the
   * workspace API and the rendered content. Identity-stable, so define it once.
   */
  renderProvider?:
    | ((api: WorkspaceApi, children: ReactNode) => ReactNode)
    | null;
  /** File to open first; falls back to a sensible entry file when absent. */
  entryFile?: string | null;
  /**
   * When set, only these paths are editable and every other file is read-only
   * (e.g. lock tests/config so only the implementation file can be changed).
   * Null/undefined keeps all files editable, subject to `readOnly`.
   */
  editablePaths?: string[] | null;
  /**
   * Show the terminal panel + its toggle. Pass `false` to deny terminal access
   * entirely (e.g. assessment / interview mode where the candidate shouldn't
   * have a shell). Tests still run via the runtime under the hood.
   */
  terminalEnabled?: boolean;
  /**
   * Show the right-hand preview/console column. Pass `false` for tasks with no
   * UI to render (e.g. a pure JS-utility problem): the layout collapses to two
   * columns — side panel + editor — and the editor reclaims the width. The dev
   * server still boots under the hood so tests stay runnable.
   */
  previewEnabled?: boolean;
  /**
   * Whether the in-browser runtime can boot here. `false` (no cross-origin
   * isolation — many mobiles, Safari) falls back to a read/edit/collaborate
   * shell: editor + sync work, but preview/terminal/tests are hidden. Default true.
   */
  runtimeEnabled?: boolean;
}

/** The single-column mobile layout shows one of these regions at a time. */
type WorkspaceTab =
  | "problem"
  | "files"
  | "code"
  | "tests"
  | "terminal"
  | "preview";

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

function pickDefaultFile(
  ydoc: Y.Doc,
  entryFile?: string | null,
): string | null {
  const files = listFilePaths(ydoc);
  // A caller-supplied entry file wins when it exists in the doc (e.g. the file
  // a task wants the user to start in); otherwise fall back to a sensible one.
  if (entryFile && files.includes(entryFile)) return entryFile;
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
  roomId,
  aiEnabled = true,
  sidePanel = null,
  bottomPanel = null,
  renderProvider = null,
  entryFile = null,
  editablePaths = null,
  terminalEnabled = true,
  previewEnabled = true,
  runtimeEnabled = true,
}: WorkspaceProps) {
  const hasSidePanel = sidePanel != null;
  // Preview, terminal, and the tests drawer are runtime surfaces — hidden when
  // the runtime can't boot, leaving a read/edit/collaborate shell.
  const hasBottomPanel = bottomPanel != null && runtimeEnabled;
  const showPreviewColumn = previewEnabled && runtimeEnabled;
  const terminalAvailable = terminalEnabled && runtimeEnabled;
  // The Files navigator popover in the editor tab bar (side-panel mode only —
  // without a side panel the file explorer owns the whole left column).
  const [filesOpen, setFilesOpen] = useState(false);
  const runtime = useWebContainerRuntime({ ydoc, enabled: runtimeEnabled });
  // Below `md` the resizable columns are unusable → single-column tabbed layout.
  const isMobile = useIsMobile();
  const { byPath: presenceByPath, setActiveFile } = useFilePresence(provider);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Keep the preview iframe (e.g. a Next.js error overlay) from stealing the
  // caret out of the editor while the user is typing.
  useIframeFocusGuard();

  // Auto-capture the preview as the ducklet's thumbnail / OG image (editable
  // sessions only; one uploader per room via awareness leader election).
  const editable = !readOnly && !!provider && roomId != null;
  useRoomPreviewCapture({
    ydoc,
    provider,
    runtime,
    roomId: roomId ?? 0,
    // No runtime → no preview to screenshot.
    enabled: editable && runtimeEnabled,
  });

  // Monaco (loaded once via the pinned CDN loader) powers TS intelligence,
  // collaboration and AI completion. Its hooks live at the workspace level so
  // one language service + model set is shared across all open files.
  const monaco = useMonaco();
  const { aiCompletion, tsIntelligence } = useEditorSettings();
  const { models, ready: modelsReady } = useEditorModels({ monaco, ydoc });
  useTsDefaults({ monaco, ydoc, enabled: tsIntelligence });
  // Mirror the real installed node_modules .d.ts into Monaco once `npm install`
  // finishes — the editor's source of truth for dependency types.
  useNodeModulesTypes({
    monaco,
    container: runtime.container,
    enabled: tsIntelligence,
  });
  // AI ghost text (+ the Ask dock below) is off whenever aiEnabled is false.
  useAiInlineCompletion({
    monaco,
    enabled: !!provider && aiCompletion && aiEnabled,
    roomId,
  });

  const [openPaths, setOpenPaths] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  // Collapsed by default — diffs reviewed in the editor want the vertical room.
  const [showTerminal, setShowTerminal] = useState(false);
  // The bottom panel (e.g. test results) is the focus when present — open it.
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  // Active mobile tab — open on the problem if there's a side panel, else code.
  const [mobileTab, setMobileTab] = useState<WorkspaceTab>(
    hasSidePanel ? "problem" : "code",
  );
  // Pending AI edits keyed by path. Local-only: a proposal is written to the
  // shared doc only when the user accepts it, never on arrival.
  const [pending, setPending] = useState<Record<string, PendingEdit>>({});
  const pendingPaths = useMemo(() => new Set(Object.keys(pending)), [pending]);
  const pendingDeletes = useMemo(
    () =>
      new Set(
        Object.entries(pending)
          .filter(([, e]) => e.kind === "delete")
          .map(([path]) => path),
      ),
    [pending],
  );

  // Open a sensible entry file on first load. Initializes the editor from the
  // external Y.Doc (and re-runs if the doc identity changes), so it must be an
  // effect rather than render-time derived state.
  useEffect(() => {
    const initial = pickDefaultFile(ydoc, entryFile);
    if (initial) {
      setOpenPaths([initial]);
      setActivePath(initial);
    }
  }, [ydoc, entryFile]);

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
      const snapshot = readAllFiles(ydoc);
      // Drop deletes of files that don't exist and writes missing content.
      const valid = edits.filter((e) =>
        e.delete
          ? snapshot[e.path] !== undefined
          : typeof e.content === "string",
      );
      if (valid.length === 0) return;
      setPending((prev) => {
        const next = { ...prev };
        for (const e of valid) {
          const base = snapshot[e.path];
          next[e.path] = e.delete
            ? { kind: "delete", proposed: "", base: base ?? "", isNew: false }
            : {
                kind: "write",
                proposed: e.content ?? "",
                base: base ?? "",
                isNew: base === undefined,
              };
        }
        return next;
      });
      const first = valid[0];
      if (first) openFile(first.path);
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

  const chat = useAskChat({ ydoc, onProposal: registerProposal, roomId });

  // Load a batch of files as reviewable diffs in the main editor, reusing the
  // AI-proposal flow (accept overwrites, reject keeps). Exposed to side panels
  // via WorkspaceApi — e.g. machine-coding's "reveal solution".
  const loadFilesAsDiff = useCallback(
    (files: Record<string, string>) => {
      registerProposal(
        Object.entries(files).map(([path, content]) => ({ path, content })),
      );
    },
    [registerProposal],
  );

  const acceptEdit = useCallback(
    (path: string, content: string) => {
      if (pending[path]?.kind === "delete") {
        deleteFile(ydoc, path);
        dropPending(path);
        closeFile(path);
        return;
      }
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
    [ydoc, dropPending, closeFile, pending, runtime, chat],
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

  // Per-file lock: when editablePaths is set, only those files are writable —
  // the implementation file stays editable while tests/config/demo are locked.
  const lockedByPolicy =
    editablePaths != null &&
    activePath != null &&
    !editablePaths.includes(activePath);
  const activeReadOnly = readOnly || lockedByPolicy;

  // Imperative surface handed to feature panels (side + bottom) and the
  // optional provider wrapper.
  const readFiles = useCallback(() => readAllFiles(ydoc), [ydoc]);
  const api = useMemo<WorkspaceApi>(
    () => ({ runtime, loadFilesAsDiff, readFiles }),
    [runtime, loadFilesAsDiff, readFiles],
  );

  const fileExplorer = (
    <FileExplorer
      ydoc={ydoc}
      readOnly={readOnly}
      activePath={activePath}
      onOpen={openFile}
      presenceByPath={presenceByPath}
      pendingPaths={pendingPaths}
      pendingDeletes={pendingDeletes}
      editablePaths={editablePaths}
    />
  );

  // In side-panel mode the file tree lives in a dropdown at the head of the
  // editor's tab bar (the left column is the feature's panel, e.g. a problem
  // statement). Opening a file dismisses the popover so you land in the editor.
  const filesNav = hasSidePanel ? (
    <Popover open={filesOpen} onOpenChange={setFilesOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Browse files"
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r px-3 py-1.5 text-xs",
            filesOpen
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          <FolderTree className="size-3.5" />
          Files
          <ChevronDown className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={0}
        className="w-72 overflow-hidden p-0"
      >
        <div className="h-[min(70vh,28rem)]">
          <FileExplorer
            ydoc={ydoc}
            readOnly={readOnly}
            activePath={activePath}
            onOpen={(path) => {
              openFile(path);
              setFilesOpen(false);
            }}
            presenceByPath={presenceByPath}
            pendingPaths={pendingPaths}
            pendingDeletes={pendingDeletes}
            editablePaths={editablePaths}
          />
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  // Two-column mode (no preview) gives the side panel + editor the whole width;
  // the side panel widens so a problem statement has room to read.
  const sideDefault =
    !showPreviewColumn && hasSidePanel ? 38 : hasSidePanel ? 30 : 18;
  const editorDefault = showPreviewColumn
    ? hasSidePanel
      ? 44
      : 52
    : 100 - sideDefault;

  // Feature side panel (problem + toolbar), or null when the left column is just
  // the file tree. Reused by the desktop column and the mobile "Problem" tab.
  const sidePanelRegion = sidePanel ? (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <span className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
          {sidePanel.label}
        </span>
        <div className="flex-1" />
        {sidePanel.toolbar}
      </div>
      <div className="min-h-0 flex-1">{sidePanel.render(api)}</div>
    </div>
  ) : null;

  // Hoisted so the desktop column and the mobile "Code" tab share one editor.
  const editorTabs = (
    <EditorTabs
      openPaths={openPaths}
      activePath={activePath}
      onSelect={setActivePath}
      onClose={closeFile}
      presenceByPath={presenceByPath}
      pendingPaths={pendingPaths}
      pendingDeletes={pendingDeletes}
      leading={filesNav}
      actions={
        <>
          {activeReadOnly && activePath && !activePending && (
            <span
              className="text-muted-foreground mr-1 flex items-center gap-1 text-xs"
              title="This file is read-only — edit the implementation file"
            >
              <Lock className="size-3" />
              Read-only
            </span>
          )}
          <EditorSettingsDialog showShortcuts={false} />
        </>
      }
    />
  );

  const editorPane = (
    <div className="relative h-full">
      {!monaco ? (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          Loading editor…
        </div>
      ) : activePath && activePending ? (
        <ReviewEditor
          key={activePath}
          path={activePath}
          kind={activePending.kind}
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
          readOnly={activeReadOnly}
        />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          Select a file to start editing
        </div>
      )}

      {/* Floating AI chat bar overlaid at the bottom of the editor. Hidden
          when AI is disabled (e.g. assessment mode). */}
      {!readOnly && aiEnabled && (
        <AskDock
          chat={chat}
          pendingPaths={pendingPaths}
          pendingDeletes={pendingDeletes}
          onOpenFile={openFile}
        />
      )}
    </div>
  );

  // Desktop editor column: tabs, editor, optional tests/terminal split + toggles.
  const editorColumn = (
    <div className="flex h-full flex-col">
      {editorTabs}

      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={70} minSize={20}>
          {editorPane}
        </ResizablePanel>

        {hasBottomPanel && showBottomPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={32} minSize={12}>
              {bottomPanel.render(api)}
            </ResizablePanel>
          </>
        )}

        {terminalAvailable && showTerminal && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={10}>
              <TerminalPanel runtime={runtime} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {(terminalAvailable || hasBottomPanel) && (
        <div className="bg-muted/20 flex h-7 items-center gap-1 border-t px-2">
          {hasBottomPanel && (
            <Button
              variant={showBottomPanel ? "secondary" : "ghost"}
              size="sm"
              className="h-5 rounded-xs px-2 text-xs"
              onClick={() => setShowBottomPanel((v) => !v)}
              title={`Toggle ${bottomPanel.label}`}
            >
              {bottomPanel.icon}
              {bottomPanel.label}
            </Button>
          )}
          {terminalAvailable && (
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
          )}
        </div>
      )}
    </div>
  );

  // The desktop preview column (preview + an optional console split below).
  const previewColumn = (
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
  );

  const desktopContent = (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={sideDefault}
        minSize={hasSidePanel ? 22 : 12}
        maxSize={hasSidePanel ? 48 : 30}
      >
        {sidePanelRegion ?? fileExplorer}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={editorDefault} minSize={25}>
        {editorColumn}
      </ResizablePanel>

      {showPreviewColumn && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={hasSidePanel ? 26 : 30} minSize={20}>
            {previewColumn}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );

  // Mobile: one region at a time behind a tab strip — only the tabs that apply
  // (no preview/terminal/tests without a runtime, no "Problem" without a panel).
  const mobileTabs: { id: WorkspaceTab; label: string }[] = [
    hasSidePanel
      ? { id: "problem", label: sidePanel.label }
      : { id: "files", label: "Files" },
    { id: "code", label: "Code" },
    ...(hasBottomPanel
      ? [{ id: "tests" as const, label: bottomPanel.label }]
      : []),
    ...(showPreviewColumn ? [{ id: "preview" as const, label: "Preview" }] : []),
    ...(terminalAvailable
      ? [{ id: "terminal" as const, label: "Terminal" }]
      : []),
  ];
  // Keep the selection valid if the available tabs change (e.g. runtime state).
  const activeMobileTab = mobileTabs.some((t) => t.id === mobileTab)
    ? mobileTab
    : (mobileTabs[0]?.id ?? "code");

  const mobileRegion = (() => {
    switch (activeMobileTab) {
      case "problem":
        return sidePanelRegion;
      case "files":
        return fileExplorer;
      case "tests":
        return <div className="h-full">{bottomPanel?.render(api)}</div>;
      case "terminal":
        return <TerminalPanel runtime={runtime} />;
      case "preview":
        return <PreviewPanel runtime={runtime} />;
      case "code":
      default:
        return (
          <div className="flex h-full flex-col">
            {editorTabs}
            <div className="min-h-0 flex-1">{editorPane}</div>
          </div>
        );
    }
  })();

  const mobileContent = (
    <div className="flex h-full flex-col">
      <div className="bg-muted/20 flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2 py-1.5">
        {mobileTabs.map((t) => (
          <Button
            key={t.id}
            variant={activeMobileTab === t.id ? "secondary" : "ghost"}
            size="sm"
            className="h-7 shrink-0 rounded-md px-3 text-xs"
            onClick={() => setMobileTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1">{mobileRegion}</div>
    </div>
  );

  const content = isMobile ? mobileContent : desktopContent;

  // Banner explains the missing preview/terminal/tests when the runtime is off.
  const body = (
    <div className="flex h-full flex-col">
      {!runtimeEnabled && (
        <RuntimeUnavailableBanner
          collaborative={!readOnly && provider != null}
        />
      )}
      <div className="min-h-0 flex-1">{content}</div>
    </div>
  );

  // A feature can wrap the workspace in a shared-state provider (e.g. so the
  // Problem panel's "Run tests" and the Tests drawer read one run state).
  return <>{renderProvider ? renderProvider(api, body) : body}</>;
}

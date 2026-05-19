"use client";

import { useEffect, useState } from "react";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxTree } from "@codemirror/language";
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror, { Extension } from "@uiw/react-codemirror";
import { LayoutTemplate, Terminal } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useDebounce } from "~/hooks/use-debounce";
import { Console, LogEntry } from "~/components/collab-editor/console";
import { Preview } from "~/components/collab-editor/preview";

type LayoutType = "top" | "left";

interface GuestEditorProps {
  html: string;
  css: string;
  js: string;
  head: string;
  body: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onJsChange: (value: string) => void;
}

const languageExtensions = {
  js: () => javascript(),
  html: () => html(),
  css: () => css(),
};

// Syntax linter that extracts errors from the Lezer parse tree
const syntaxLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const tree = syntaxTree(view.state);

  tree.iterate({
    enter: (node: { type: { isError: boolean }; from: number; to: number }) => {
      if (node.type.isError) {
        const errorText = view.state.doc.sliceString(node.from, node.to);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: "error",
          message: errorText.trim()
            ? `Syntax error: unexpected "${errorText}"`
            : "Syntax error: unexpected token",
        });
      }
    },
  });

  return diagnostics;
});

export function GuestEditor({
  html: htmlValue,
  css: cssValue,
  js: jsValue,
  head,
  body,
  onHtmlChange,
  onCssChange,
  onJsChange,
}: GuestEditorProps) {
  const [layout, setLayout] = useState<LayoutType>("top");
  const [showConsole, setShowConsole] = useState(true);

  const debouncedHtml = useDebounce(htmlValue, 600);
  const debouncedCss = useDebounce(cssValue, 600);
  const debouncedJs = useDebounce(jsValue, 600);

  // Console Logs Logic
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        setLogs((prev) => [
          ...prev,
          {
            method: event.data.method,
            args: event.data.args,
            timestamp: Date.now(),
            lineno: event.data.lineno,
            colno: event.data.colno,
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const clearLogs = () => setLogs([]);

  const htmlExtensions: Extension[] = [
    languageExtensions.html(),
    oneDark,
    EditorView.lineWrapping,
    syntaxLinter,
    lintGutter(),
  ];

  const cssExtensions: Extension[] = [
    languageExtensions.css(),
    oneDark,
    EditorView.lineWrapping,
    syntaxLinter,
    lintGutter(),
  ];

  const jsExtensions: Extension[] = [
    languageExtensions.js(),
    oneDark,
    EditorView.lineWrapping,
    syntaxLinter,
    lintGutter(),
  ];

  const Editors = (
    <>
      <ResizablePanel defaultSize={33} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            HTML
          </div>
          <div className="h-full w-full overflow-hidden">
            <CodeMirror
              className="h-full"
              height="100%"
              theme={oneDark}
              extensions={htmlExtensions}
              value={htmlValue}
              onChange={onHtmlChange}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle className="bg-transparent" withHandle />
      <ResizablePanel defaultSize={34} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            CSS
          </div>
          <div className="h-full w-full overflow-hidden">
            <CodeMirror
              className="h-full"
              height="100%"
              theme={oneDark}
              extensions={cssExtensions}
              value={cssValue}
              onChange={onCssChange}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle className="bg-transparent" withHandle />
      <ResizablePanel defaultSize={33} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            JS
          </div>
          <div className="h-full w-full overflow-hidden">
            <CodeMirror
              className="h-full"
              height="100%"
              theme={oneDark}
              extensions={jsExtensions}
              value={jsValue}
              onChange={onJsChange}
            />
          </div>
        </div>
      </ResizablePanel>
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="bg-muted/20 flex items-center justify-end gap-1 border-b px-2 py-1">
        <span className="text-muted-foreground mr-2 text-xs">Layout:</span>
        <Button
          variant={layout === "top" ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2"
          onClick={() => setLayout("top")}
          title="Editors Top"
        >
          <LayoutTemplate className="mr-1 h-3 w-3" />
          Top
        </Button>
        <Button
          variant={layout === "left" ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2"
          onClick={() => setLayout("left")}
          title="Editors Left"
        >
          Left
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {layout === "top" ? (
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={20}>
              <ResizablePanelGroup direction="horizontal">
                {Editors}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={20}>
                  <div className="h-full bg-white">
                    <Preview
                      html={debouncedHtml}
                      css={debouncedCss}
                      js={debouncedJs}
                      head={head}
                      body={body}
                    />
                  </div>
                </ResizablePanel>

                {showConsole && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                      defaultSize={30}
                      minSize={10}
                      className="bg-[#1e1e1e]"
                    >
                      <Console
                        logs={logs}
                        onClear={clearLogs}
                        onClose={() => setShowConsole(false)}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                {Editors}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={70} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={20}>
                  <div className="h-full bg-white">
                    <Preview
                      html={debouncedHtml}
                      css={debouncedCss}
                      js={debouncedJs}
                      head={head}
                      body={body}
                    />
                  </div>
                </ResizablePanel>

                {showConsole && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                      defaultSize={30}
                      minSize={10}
                      className="bg-[#1e1e1e]"
                    >
                      <Console
                        logs={logs}
                        onClear={clearLogs}
                        onClose={() => setShowConsole(false)}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-muted/20 flex h-7 items-center border-t px-2">
        <Button
          variant={showConsole ? "secondary" : "ghost"}
          size="sm"
          className="h-5 rounded-xs px-2 text-xs"
          onClick={() => setShowConsole(!showConsole)}
          title="Toggle Console"
        >
          <Terminal className="mr-1 h-3 w-3" />
          Console
          {logs.filter((l) => l.method === "error").length > 0 && (
            <div className="ml-2 flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {logs.filter((l) => l.method === "error").length}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

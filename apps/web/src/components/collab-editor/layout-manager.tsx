import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { LayoutTemplate, Terminal } from "lucide-react";
import type * as Y from "yjs";

import { EditorSettingsDialog } from "~/components/editor-settings-dialog";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useDebounce } from "~/hooks/use-debounce";
import { useIsMobile } from "~/hooks/use-is-mobile";
import type { LogEntry } from "./console";
import { Console } from "./console";
import { CollabEditor } from "./index";
import { Preview } from "./preview";

type LayoutType = "top" | "left";

interface LayoutManagerProps {
  provider: HocuspocusProvider;
  ydoc: Y.Doc;
  head: string;
  body: string;
  readOnly?: boolean;
}

export function LayoutManager({
  provider,
  ydoc,
  head,
  body,
  readOnly = false,
}: LayoutManagerProps) {
  const [layout, setLayout] = useState<LayoutType>("top");
  const [showConsole, setShowConsole] = useState(true);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"html" | "css" | "js" | "preview">(
    "html",
  );

  // Local state for preview
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");

  const debouncedHtml = useDebounce(html, 600);
  const debouncedCss = useDebounce(css, 600);
  const debouncedJs = useDebounce(js, 600);

  useEffect(() => {
    if (!ydoc) return;

    const htmlText = ydoc.getText("html");
    const cssText = ydoc.getText("css");
    const jsText = ydoc.getText("js");

    const updateState = () => {
      setHtml(htmlText.toString());
      setCss(cssText.toString());
      setJs(jsText.toString());
    };

    updateState();

    const observer = () => updateState();
    htmlText.observe(observer);
    cssText.observe(observer);
    jsText.observe(observer);

    return () => {
      htmlText.unobserve(observer);
      cssText.unobserve(observer);
      jsText.unobserve(observer);
    };
  }, [ydoc]);

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

  const Editors = (
    <>
      <ResizablePanel defaultSize={33} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            HTML
          </div>
          <CollabEditor
            language="html"
            field="html"
            provider={provider}
            ydoc={ydoc}
            readOnly={readOnly}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle className="bg-transparent" withHandle />
      <ResizablePanel defaultSize={34} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            CSS
          </div>
          <CollabEditor
            language="css"
            field="css"
            provider={provider}
            ydoc={ydoc}
            readOnly={readOnly}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle className="bg-transparent" withHandle />
      <ResizablePanel defaultSize={33} minSize={10}>
        <div className="flex h-full flex-col px-1">
          <div className="bg-muted text-muted-foreground flex justify-between border-b px-3 py-1 text-xs font-bold">
            JS
          </div>
          <CollabEditor
            language="js"
            field="js"
            provider={provider}
            ydoc={ydoc}
            readOnly={readOnly}
          />
        </div>
      </ResizablePanel>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
          className="flex h-full flex-col"
        >
          <TabsList className="bg-muted/20 grid w-full grid-cols-4 rounded-none border-b">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="js">JS</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="m-0 flex-1 overflow-hidden">
            <CollabEditor
              language="html"
              field="html"
              provider={provider}
              ydoc={ydoc}
              readOnly={readOnly}
            />
          </TabsContent>
          <TabsContent value="css" className="m-0 flex-1 overflow-hidden">
            <CollabEditor
              language="css"
              field="css"
              provider={provider}
              ydoc={ydoc}
              readOnly={readOnly}
            />
          </TabsContent>
          <TabsContent value="js" className="m-0 flex-1 overflow-hidden">
            <CollabEditor
              language="js"
              field="js"
              provider={provider}
              ydoc={ydoc}
              readOnly={readOnly}
            />
          </TabsContent>
          <TabsContent
            value="preview"
            className="m-0 flex-1 overflow-hidden bg-white"
          >
            <Preview
              html={debouncedHtml}
              css={debouncedCss}
              js={debouncedJs}
              head={head}
              body={body}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

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
        <div className="bg-border mx-1 h-4 w-px" />
        <EditorSettingsDialog showShortcuts={false} />
      </div>

      <div className="flex-1 overflow-hidden">
        {layout === "top" ? (
          // TOP LAYOUT: Editors on top (horizontal), Preview + Console bottom
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={20}>
              <ResizablePanelGroup direction="horizontal">
                {Editors}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={20}>
              {/* Preview + Console Split */}
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
          // LEFT LAYOUT: Editors on left (vertical stack), Preview + Console right
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                {Editors}
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={70} minSize={20}>
              {/* Preview + Console Split */}
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

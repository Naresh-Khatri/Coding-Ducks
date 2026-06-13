"use client";

import { useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";

import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { BootStepper } from "./boot-stepper";

export function PreviewPanel({
  runtime,
  consoleToggle,
}: {
  runtime: WebContainerRuntime;
  /** Optional console toggle rendered in the toolbar (see ConsoleToggleButton). */
  consoleToggle?: React.ReactNode;
}) {
  const { previewUrl, status, error, restart } = runtime;
  const [reloadKey, setReloadKey] = useState(0);
  const [editableUrl, setEditableUrl] = useState(previewUrl ?? "");
  // prevPreviewUrl is read during render for the prev-prop comparison below — not a handler-only state.
  const [prevPreviewUrl, setPrevPreviewUrl] = useState(previewUrl);

  // Sync editableUrl when previewUrl arrives or changes (prev-prop pattern — no effect needed)
  if (previewUrl !== prevPreviewUrl) {
    setPrevPreviewUrl(previewUrl);
    if (previewUrl) setEditableUrl(previewUrl);
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1e1e1e]">
      <div className="bg-muted/20 flex items-center gap-1 border-b px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={!previewUrl}
          onClick={() => setReloadKey((k) => k + 1)}
          title="Reload preview"
        >
          <RotateCw className="size-3.5" />
        </Button>
        <Input
          value={editableUrl}
          onChange={(e) => setEditableUrl(e.target.value)}
          placeholder="Dev server URL will appear here…"
          className="h-6 flex-1 text-xs"
          readOnly={!previewUrl}
        />
        {previewUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            asChild
            title="Open in new tab"
          >
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
        {consoleToggle}
      </div>

      <div className="relative flex-1">
        {previewUrl ? (
          <iframe
            key={reloadKey}
            src={editableUrl || previewUrl}
            title="Preview"
            className="h-full w-full border-0 bg-white"
            allow="cross-origin-isolated"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 text-sm">
            {status === "error" ? (
              <>
                <p className="text-red-500">{error ?? "Runtime error"}</p>
                <Button variant="outline" size="sm" onClick={restart}>
                  Retry
                </Button>
              </>
            ) : (
              <BootStepper status={status} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

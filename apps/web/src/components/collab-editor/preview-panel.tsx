"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RotateCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type {
  RuntimeStatus,
  WebContainerRuntime,
} from "~/lib/webcontainer/use-runtime";

const STATUS_LABEL: Record<RuntimeStatus, string> = {
  idle: "Idle",
  booting: "Booting runtime…",
  mounting: "Mounting files…",
  running: "Starting dev server…",
  error: "Runtime error",
};

export function PreviewPanel({ runtime }: { runtime: WebContainerRuntime }) {
  const { previewUrl, status, error, restart } = runtime;
  const [reloadKey, setReloadKey] = useState(0);
  const [editableUrl, setEditableUrl] = useState("");

  useEffect(() => {
    if (previewUrl) setEditableUrl(previewUrl);
  }, [previewUrl]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#1e1e1e]">
      <div className="bg-muted/20 flex items-center gap-1 border-b px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={!previewUrl}
          onClick={() => setReloadKey((k) => k + 1)}
          title="Reload preview"
        >
          <RotateCw className="h-3.5 w-3.5" />
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
            className="h-6 w-6"
            asChild
            title="Open in new tab"
          >
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>

      <div className="relative flex-1">
        {previewUrl ? (
          <iframe
            key={reloadKey}
            src={editableUrl || previewUrl}
            title="Preview"
            className="h-full w-full border-0 bg-white"
            allow="cross-origin-isolated"
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
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>{STATUS_LABEL[status]}</p>
                <p className="text-muted-foreground/70 max-w-xs text-center text-xs">
                  First boot installs dependencies in your browser — this can
                  take a little while.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

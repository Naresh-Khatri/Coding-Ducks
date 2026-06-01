"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "~/components/ui/button";
import type { SupportResult } from "~/lib/webcontainer/support";
import {
  checkWebContainerSupport,
  unsupportedMessage,
} from "~/lib/webcontainer/support";

/**
 * Runs the WebContainer support check on the client after mount (it depends on
 * `window.crossOriginIsolated`, navigator, etc.). `checked` is false until the
 * first client render so callers can avoid flashing the gate during SSR.
 */
export function useWebContainerSupport(): SupportResult & { checked: boolean } {
  const [result, setResult] = useState<SupportResult & { checked: boolean }>({
    supported: false,
    checked: false,
  });

  useEffect(() => {
    setResult({ ...checkWebContainerSupport(), checked: true });
  }, []);

  return result;
}

/**
 * Full-screen fallback shown when the current browser/device can't run the
 * ducklet runtime. Keeps the user oriented with a path back to the list.
 */
export function DesktopOnlyGate({
  reason,
}: {
  reason: SupportResult["reason"];
}) {
  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <MonitorSmartphone className="text-muted-foreground h-7 w-7" />
      </div>
      <h2 className="text-2xl font-semibold">Best on desktop</h2>
      <p className="text-muted-foreground">
        {unsupportedMessage(reason ?? "not-cross-origin-isolated")}
      </p>
      <Button variant="outline" asChild>
        <Link href="/ducklets">Back to ducklets</Link>
      </Button>
    </div>
  );
}

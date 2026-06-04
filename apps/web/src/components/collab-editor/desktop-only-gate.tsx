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

// Reload-loop guard, persisted across the reload; cleared once isolated (or
// permanently unsupported).
const COI_RELOAD_GUARD = "ducklet-coi-reload-attempted";

function readGuard(): boolean {
  try {
    return sessionStorage.getItem(COI_RELOAD_GUARD) !== null;
  } catch {
    // Storage unavailable — treat as "already tried" so we never loop.
    return true;
  }
}

function writeGuard(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(COI_RELOAD_GUARD, "1");
    else sessionStorage.removeItem(COI_RELOAD_GUARD);
  } catch {
    // ignore — see readGuard()
  }
}

/**
 * Runs the WebContainer support check on the client after mount. `checked` is
 * false until then so callers don't flash the gate during SSR.
 *
 * Cross-origin isolation comes from the COOP/COEP headers, scoped to
 * `/ducklets/:id+`. A soft-nav into a room from a non-isolated page reuses the
 * old, un-isolated document, so `crossOriginIsolated` stays false even though a
 * direct load would be isolated. Reload once to re-fetch with the headers,
 * guarded so a setup that can never isolate falls through to the gate.
 */
export function useWebContainerSupport(): SupportResult & { checked: boolean } {
  // Initial value is a safe SSR fallback; real check uses window.crossOriginIsolated — browser-only, unsafe during SSR render
  // react-doctor-disable-next-line react-doctor/rendering-hydration-no-flicker
  const [result, setResult] = useState<SupportResult & { checked: boolean }>({
    supported: false,
    checked: false,
  });

  // Browser-only init: checkWebContainerSupport() reads window/navigator, must stay in effect for SSR safety
  // react-doctor-disable-next-line react-doctor/no-initialize-state
  useEffect(() => {
    const support = checkWebContainerSupport();

    if (support.reason === "not-cross-origin-isolated" && !readGuard()) {
      writeGuard(true);
      window.location.reload();
      return; // page is reloading — don't flip `checked` and flash the gate
    }

    // Isolated, or permanently unsupported: clear so a later soft-nav can retry.
    writeGuard(false);
    setResult({ ...support, checked: true });
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
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <MonitorSmartphone className="text-muted-foreground size-7" />
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

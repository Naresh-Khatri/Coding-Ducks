"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";

import type { SupportResult } from "~/lib/webcontainer/support";
import { checkWebContainerSupport, isSafari } from "~/lib/webcontainer/support";

// Reload-loop guard, persisted across the reload; cleared once isolated (or
// once we've spent our single recovery attempt).
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
 * Client-side support check (after mount, so `checked` is false during SSR).
 * `supported` means the runtime can boot; when false the workspace still renders
 * without preview/terminal/tests. Reloads once to recover the cross-origin
 * isolation a soft-nav drops — except on Safari, which can't isolate under our
 * `credentialless` COEP anyway.
 */
export function useWebContainerSupport(): SupportResult & { checked: boolean } {
  // SSR-safe default; the real check needs `window`, so it runs in the effect.
  const [result, setResult] = useState<SupportResult & { checked: boolean }>({
    supported: false,
    checked: false,
  });

  useEffect(() => {
    const support = checkWebContainerSupport();

    if (
      support.reason === "not-cross-origin-isolated" &&
      !isSafari() &&
      !readGuard()
    ) {
      writeGuard(true);
      window.location.reload();
      return; // page is reloading — don't flip `checked` yet
    }

    // Isolated, or recovery spent: clear so a later soft-nav can retry once.
    writeGuard(false);
    setResult({ ...support, checked: true });
  }, []);

  return result;
}

/**
 * Non-blocking notice shown when the runtime can't boot here (no cross-origin
 * isolation). The editor + collaboration still work; this says why preview/
 * terminal/tests are gone.
 */
export function RuntimeUnavailableBanner({
  collaborative = false,
}: {
  /** Whether edits sync to other people (a live ducklet) vs. local-only. */
  collaborative?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
      <MonitorSmartphone className="size-3.5 shrink-0" />
      <span>
        Live preview, terminal, and tests need a desktop browser with
        cross-origin isolation, so they're off here. You can still read
        {collaborative ? ", edit, and collaborate on" : " and edit"} the code.
      </span>
    </div>
  );
}

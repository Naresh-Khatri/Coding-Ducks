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
 * Runs the WebContainer support check on the client after mount. `checked` is
 * false until then so callers don't decide layout during SSR. `supported`
 * means the in-browser runtime can boot; when it's false the workspace still
 * renders, just without preview/terminal/tests (see `runtimeEnabled`).
 *
 * Cross-origin isolation comes from the COOP/COEP headers, scoped to the
 * workspace routes. A soft-nav into a room from a non-isolated page reuses the
 * old, un-isolated document, so `crossOriginIsolated` stays false even though a
 * direct load would be isolated. Reload once to re-fetch with the headers,
 * guarded so we never loop. Safari is skipped: it ignores our `credentialless`
 * COEP, so a reload can't isolate it — it goes straight to read/edit mode.
 */
export function useWebContainerSupport(): SupportResult & { checked: boolean } {
  // Initial value is a safe SSR fallback; real check uses window.crossOriginIsolated — browser-only, unsafe during SSR render
  const [result, setResult] = useState<SupportResult & { checked: boolean }>({
    supported: false,
    checked: false,
  });

  // Browser-only init: checkWebContainerSupport() reads window/navigator, must stay in effect for SSR safety
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

    // Isolated, or recovery spent/not applicable: clear so a later soft-nav can
    // retry once more.
    writeGuard(false);
    setResult({ ...support, checked: true });
  }, []);

  return result;
}

/**
 * Slim, non-blocking notice shown inside the workspace when the in-browser
 * runtime can't boot here (no cross-origin isolation — e.g. an older browser,
 * Safari, or a low-capability device). The editor and realtime collaboration
 * still work; this explains why preview/terminal/tests are absent.
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

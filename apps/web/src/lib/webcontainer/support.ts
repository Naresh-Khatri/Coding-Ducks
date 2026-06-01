/**
 * Feature detection for the ducklet WebContainer runtime.
 *
 * WebContainers need cross-origin isolation (SharedArrayBuffer) and are only
 * supported on desktop Chromium/Firefox. We gate on these before booting so
 * unsupported browsers see a friendly "open on desktop" screen instead of a
 * cryptic boot failure.
 */

export type UnsupportedReason =
  | "ssr"
  | "not-cross-origin-isolated"
  | "no-shared-array-buffer"
  | "mobile"
  | "safari";

export interface SupportResult {
  supported: boolean;
  reason?: UnsupportedReason;
}

export function checkWebContainerSupport(): SupportResult {
  if (typeof window === "undefined") {
    return { supported: false, reason: "ssr" };
  }

  // The COOP/COEP headers (set on /ducklets/:id+) must have made the page
  // cross-origin isolated, which is what unlocks SharedArrayBuffer.
  if (!window.crossOriginIsolated) {
    return { supported: false, reason: "not-cross-origin-isolated" };
  }
  if (typeof SharedArrayBuffer === "undefined") {
    return { supported: false, reason: "no-shared-array-buffer" };
  }

  const ua = navigator.userAgent;

  // Mobile browsers can't run WebContainers (no SAB threads / memory limits).
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    return { supported: false, reason: "mobile" };
  }

  // Safari doesn't support COEP `credentialless`, so isolation here would have
  // required `require-corp` (which breaks our cross-origin avatars). Treat it
  // as unsupported. Exclude Chrome/Edge/Firefox-on-iOS which also match
  // "Safari" in their UA string.
  const isSafari =
    /^((?!chrome|chromium|crios|edg|android|fxios|firefox).)*safari/i.test(ua);
  if (isSafari) {
    return { supported: false, reason: "safari" };
  }

  return { supported: true };
}

export function unsupportedMessage(reason: UnsupportedReason): string {
  switch (reason) {
    case "mobile":
      return "Ducklets run a full Node.js environment in your browser, which isn't available on mobile devices. Open this on a desktop browser to start coding.";
    case "safari":
      return "Ducklets aren't supported in Safari yet. Please use a recent version of Chrome, Edge, or Firefox on desktop.";
    case "not-cross-origin-isolated":
    case "no-shared-array-buffer":
      return "Your browser couldn't enter the secure mode ducklets need. Make sure you're on a recent desktop Chrome, Edge, or Firefox, then reload.";
    case "ssr":
    default:
      return "Loading…";
  }
}

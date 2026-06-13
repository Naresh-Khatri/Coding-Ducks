/**
 * Feature detection for the WebContainer runtime (ducklets + machine coding).
 *
 * A WebContainer can boot wherever the page is cross-origin isolated (which
 * unlocks `SharedArrayBuffer`) — that's the real requirement, so we gate on the
 * *capability* rather than sniffing the user agent. Modern mobile browsers
 * (Android Chrome/Firefox, iOS Safari 16.4+) can run it too; where it can't
 * boot, the caller falls back to a read/edit/collaborate experience instead of
 * blocking the page (see the workspace's `runtimeEnabled`).
 */

export type UnsupportedReason =
  | "ssr"
  | "not-cross-origin-isolated"
  | "no-shared-array-buffer";

export interface SupportResult {
  /** Whether the in-browser WebContainer runtime can boot here. */
  supported: boolean;
  reason?: UnsupportedReason;
}

export function checkWebContainerSupport(): SupportResult {
  if (typeof window === "undefined") {
    return { supported: false, reason: "ssr" };
  }

  // The COOP/COEP headers (scoped to workspace routes in next.config) make the
  // page cross-origin isolated, which unlocks SharedArrayBuffer. The one
  // *transient* miss: a soft-nav into a room reuses the un-isolated document
  // that loaded the previous page, so a direct reload is needed to apply the
  // headers — the hook handles that recovery.
  if (!window.crossOriginIsolated) {
    return { supported: false, reason: "not-cross-origin-isolated" };
  }
  if (typeof SharedArrayBuffer === "undefined") {
    return { supported: false, reason: "no-shared-array-buffer" };
  }

  return { supported: true };
}

/**
 * True for Safari (desktop or iOS), excluding Chromium/Firefox-on-iOS which
 * also carry "Safari" in their UA. Used *only* to skip the isolation-recovery
 * reload: Safari doesn't honor our `credentialless` COEP, so it can never
 * become isolated through our headers and a reload would just waste a load —
 * it falls straight through to the read/edit experience instead.
 */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|chromium|crios|edg|android|fxios|firefox).)*safari/i.test(
    navigator.userAgent,
  );
}

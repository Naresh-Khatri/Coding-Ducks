/**
 * Feature detection for the WebContainer runtime (ducklets + machine coding).
 * Gates on the real capability — cross-origin isolation, which unlocks
 * `SharedArrayBuffer` — not the user agent, so capable mobiles run it too.
 * Callers degrade to read/edit/collaborate where it can't boot (`runtimeEnabled`).
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

  // COOP/COEP headers (workspace routes only) isolate the page and unlock
  // SharedArrayBuffer; a soft-nav stays un-isolated until the hook reloads once.
  if (!window.crossOriginIsolated) {
    return { supported: false, reason: "not-cross-origin-isolated" };
  }
  if (typeof SharedArrayBuffer === "undefined") {
    return { supported: false, reason: "no-shared-array-buffer" };
  }

  return { supported: true };
}

/**
 * Safari (desktop or iOS), excluding Chromium/Firefox-on-iOS. Used only to skip
 * the recovery reload: Safari ignores our `credentialless` COEP, so it can
 * never isolate and reloading would just waste a load.
 */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|chromium|crios|edg|android|fxios|firefox).)*safari/i.test(
    navigator.userAgent,
  );
}

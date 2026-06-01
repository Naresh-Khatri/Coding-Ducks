/**
 * Single-instance WebContainer boot.
 *
 * Only one WebContainer can exist per browser tab — `WebContainer.boot()`
 * throws if called twice. We cache the boot promise so every caller in the tab
 * shares the same instance, and expose an explicit teardown for when the user
 * leaves the ducklet (or opens a different one in the same tab).
 */
import type { WebContainer } from "@webcontainer/api";

let bootPromise: Promise<WebContainer> | null = null;

/**
 * Boot (or return the already-booting/booted) WebContainer for this tab.
 * Lazily imports `@webcontainer/api` so the ~heavy runtime isn't pulled into
 * the bundle until a user actually starts a session.
 */
export function bootWebContainer(): Promise<WebContainer> {
  bootPromise ??= (async () => {
    const { WebContainer } = await import("@webcontainer/api");
    // `credentialless` matches the COEP header we set for ducklet routes.
    return WebContainer.boot({ coep: "credentialless" });
  })();
  return bootPromise;
}

/** Tear down the current instance so a fresh one can boot (e.g. on unmount). */
export async function teardownWebContainer(): Promise<void> {
  const pending = bootPromise;
  if (!pending) return;
  bootPromise = null;
  try {
    const instance = await pending;
    instance.teardown();
  } catch {
    // Boot never resolved — nothing to tear down.
  }
}

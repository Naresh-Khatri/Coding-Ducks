import { useEffect } from "react";

/**
 * Dev-server error overlays (notably Next.js Fast Refresh) auto-focus inside
 * the cross-origin preview <iframe>, stealing the caret out of the editor. We
 * can't stop them from the parent, so when an iframe grabs focus without a
 * deliberate click into the preview, hand focus back to where the user was.
 */
export function useIframeFocusGuard(): void {
  useEffect(() => {
    let lastFocused: HTMLElement | null = null;
    let lastPointerDownAt = 0;

    const onFocusIn = (e: FocusEvent) => {
      // Track the last real focus target, ignoring the iframe itself.
      const target = e.target as HTMLElement | null;
      if (target && target.tagName !== "IFRAME") lastFocused = target;
    };

    const onPointerDown = () => {
      lastPointerDownAt = performance.now();
    };

    const onBlur = () => {
      // Defer a frame so document.activeElement settles on the iframe.
      requestAnimationFrame(() => {
        if (!(document.activeElement instanceof HTMLIFrameElement)) return;
        // A recent pointerdown means a real click into the preview — leave it.
        if (performance.now() - lastPointerDownAt < 600) return;
        if (lastFocused?.isConnected) lastFocused.focus();
      });
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}

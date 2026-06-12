import { useEffect } from "react";

/**
 * Dev-server error overlays (e.g. Next.js Fast Refresh) auto-focus the
 * cross-origin preview <iframe>, stealing the caret from the editor/chat.
 * Cross-origin frames hide their inner pointer events, so we can't see clicks
 * inside them — but we can see the pointer *hovering* the iframe. On focus loss
 * to an iframe: pointer over it ⇒ deliberate click, leave it (this is what lets
 * users type in preview inputs); otherwise an overlay stole focus, so restore.
 */
export function useIframeFocusGuard(): void {
  useEffect(() => {
    let lastFocused: HTMLElement | null = null;
    let pointerOverIframe = false;

    const onFocusIn = (e: FocusEvent) => {
      // Track the last real focus target, ignoring iframes themselves.
      const target = e.target as HTMLElement | null;
      if (target && target.tagName !== "IFRAME") lastFocused = target;
    };

    // Cross-origin frames don't bubble their inner pointer events, but
    // `mouseover` fires with the iframe as target as the cursor crosses into
    // it; moving onto any other element clears the flag.
    const onMouseOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      pointerOverIframe = target?.tagName === "IFRAME";
    };

    const onBlur = () => {
      // Defer a frame so document.activeElement settles on the iframe.
      requestAnimationFrame(() => {
        if (!(document.activeElement instanceof HTMLIFrameElement)) return;
        // Pointer over the preview → a deliberate click; leave focus there.
        if (pointerOverIframe) return;
        if (lastFocused?.isConnected) lastFocused.focus();
      });
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("mouseover", onMouseOver, true);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("mouseover", onMouseOver, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}

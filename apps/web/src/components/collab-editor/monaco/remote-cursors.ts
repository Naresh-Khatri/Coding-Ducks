"use client";

import { useEffect } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

/**
 * Render remote collaborator cursors/selections for the y-monaco binding.
 *
 * y-monaco tags each remote selection with `yRemoteSelection-<clientID>` and
 * `yRemoteSelectionHead-<clientID>` classes but ships **no** styling (unlike
 * y-codemirror.next, which drew cursors itself). So nothing is visible until we
 * supply the CSS. We derive each client's colour + name from the same Yjs
 * awareness `user` field that powers presence avatars (set in `use-socket.ts`)
 * and keep a single <style> element in sync as people join, move, and leave.
 */
export function useRemoteCursorStyles(
  provider: HocuspocusProvider | null,
): void {
  useEffect(() => {
    const awareness = provider?.awareness;
    if (!awareness) return;

    const style = document.createElement("style");
    style.dataset.duckletRemoteCursors = "";
    document.head.appendChild(style);

    // Awareness fires `change` on every cursor move; only rebuild the
    // stylesheet when the membership / colours / names actually differ.
    let lastSig = "";

    const render = () => {
      const rules: string[] = [];
      let sig = "";
      for (const [clientID, state] of awareness.getStates()) {
        if (clientID === awareness.clientID) continue; // local caret is native
        const user = (state as { user?: { name?: string; color?: string } })
          .user;
        const color = user?.color;
        if (!color || !SAFE_COLOR.test(color)) continue;
        const name = (user.name ?? "Anonymous").slice(0, 40);
        sig += `${clientID}:${color}:${name};`;
        rules.push(`
.yRemoteSelection-${clientID} { background-color: color-mix(in srgb, ${color} 30%, transparent); }
.yRemoteSelectionHead-${clientID} { border-left-color: ${color}; }
.yRemoteSelectionHead-${clientID}::after { content: ${JSON.stringify(name)}; background-color: ${color}; }`);
      }
      if (sig === lastSig) return;
      lastSig = sig;
      // textContent (not innerHTML) — no HTML parsing, so names can't inject.
      style.textContent = STATIC_CSS + rules.join("");
    };

    render();
    awareness.on("change", render);
    return () => {
      awareness.off("change", render);
      style.remove();
    };
  }, [provider]);
}

/** Only allow simple colour tokens through into the stylesheet. */
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\)|hsla?\([\d.,\s%]+\)|[a-zA-Z]+)$/;

const STATIC_CSS = `
.yRemoteSelection { border-radius: 2px; }
.yRemoteSelectionHead {
  position: absolute;
  box-sizing: border-box;
  height: 100%;
  border-left-width: 2px;
  border-left-style: solid;
  z-index: 10;
}
.yRemoteSelectionHead::after {
  position: absolute;
  top: -1.4em;
  left: -2px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1.4;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
  color: #fff;
  font-family: ui-sans-serif, system-ui, sans-serif;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
}
.yRemoteSelectionHead:hover::after { opacity: 1; }
`;

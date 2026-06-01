"use client";

import { useEffect, useRef } from "react";

import "@xterm/xterm/css/xterm.css";

import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";

/**
 * An xterm.js terminal bound to the WebContainer's interactive shell through
 * the runtime's output fan-out / input writer. xterm is imported lazily inside
 * the effect since it touches the DOM and must not run during SSR.
 */
export function TerminalPanel({ runtime }: { runtime: WebContainerRuntime }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { subscribeOutput, writeInput, resize } = runtime;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        theme: { background: "#1e1e1e", foreground: "#d4d4d4" },
        convertEol: true,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(el);
      fit.fit();
      resize(term.cols, term.rows);

      const onData = term.onData((data) => writeInput(data));
      const unsub = subscribeOutput((data) => term.write(data));

      const ro = new ResizeObserver(() => {
        try {
          fit.fit();
          resize(term.cols, term.rows);
        } catch {
          // Element not measurable yet — ignore.
        }
      });
      ro.observe(el);

      cleanup = () => {
        onData.dispose();
        unsub();
        ro.disconnect();
        term.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [subscribeOutput, writeInput, resize]);

  return <div ref={containerRef} className="h-full w-full bg-[#1e1e1e] p-1" />;
}

/**
 * Forwarding the *preview app's* runtime console into the Ducklet UI.
 *
 * The preview renders in a cross-origin iframe, so the parent can't read its
 * `console.*` output directly. Mirroring the screenshot helper in
 * `capture-preview.ts`, we inject a tiny script into every preview page via
 * `WebContainer.setPreviewScript`. Running same-origin to the user's app, it
 * patches the console methods + global error handlers and `postMessage`s each
 * entry up to our origin, where `useWebContainerRuntime` buffers and fans them
 * out to the console panel.
 *
 * Args are serialized to a compact, length-capped string *inside* the preview
 * (postMessage's structured clone can't carry functions/DOM nodes and would
 * happily clone megabytes), so only plain text crosses the boundary.
 */

/** postMessage `type` for a forwarded console entry. */
export const CONSOLE_MESSAGE_TYPE = "editor:console";

const CONSOLE_LEVELS = ["log", "info", "warn", "error", "debug"] as const;
export type ConsoleLevel = (typeof CONSOLE_LEVELS)[number];

export function isConsoleLevel(value: unknown): value is ConsoleLevel {
  return (
    typeof value === "string" &&
    (CONSOLE_LEVELS as readonly string[]).includes(value)
  );
}

export interface PreviewConsoleEntry {
  /** Monotonic id assigned by the runtime as entries arrive (stable React key). */
  id: number;
  level: ConsoleLevel;
  /** Pre-formatted, length-capped text (args joined with spaces). */
  text: string;
  /** epoch ms, stamped in the preview page. */
  timestamp: number;
}

/**
 * Build the script injected into every preview page. Patches `console.log`,
 * `console.warn`, etc. plus `error` / `unhandledrejection` and forwards each
 * to `parentOrigin` only (baked in, never trusted from the message), so a
 * third-party page embedding the same preview URL can't spoof console output.
 */
export function buildConsoleForwardScript(parentOrigin: string): string {
  return `
(function () {
  var PARENT_ORIGIN = ${JSON.stringify(parentOrigin)};
  var TYPE = ${JSON.stringify(CONSOLE_MESSAGE_TYPE)};
  var MAX_LEN = 12000;

  function fmt(value, seen, depth) {
    if (value === null) return "null";
    var t = typeof value;
    if (t === "undefined") return "undefined";
    if (t === "string") return depth === 0 ? value : JSON.stringify(value);
    if (t === "number" || t === "boolean" || t === "bigint") return String(value);
    if (t === "symbol") return value.toString();
    if (t === "function") return "\\u0192 " + (value.name || "anonymous") + "()";
    if (value instanceof Error) return value.stack || (value.name + ": " + value.message);
    if (typeof Element !== "undefined" && value instanceof Element) {
      return "<" + value.tagName.toLowerCase() + ">";
    }
    if (depth >= 4) return Array.isArray(value) ? "[Array]" : "[Object]";
    if (seen.indexOf(value) !== -1) return "[Circular]";
    seen.push(value);
    try {
      if (Array.isArray(value)) {
        var items = [];
        for (var i = 0; i < value.length && i < 100; i++) items.push(fmt(value[i], seen, depth + 1));
        return "[" + items.join(", ") + (value.length > 100 ? ", \\u2026" : "") + "]";
      }
      if (typeof Map !== "undefined" && value instanceof Map) return "Map(" + value.size + ")";
      if (typeof Set !== "undefined" && value instanceof Set) return "Set(" + value.size + ")";
      var keys = Object.keys(value);
      var parts = [];
      for (var j = 0; j < keys.length && j < 100; j++) parts.push(keys[j] + ": " + fmt(value[keys[j]], seen, depth + 1));
      var name = value.constructor && value.constructor.name;
      var prefix = name && name !== "Object" ? name + " " : "";
      return prefix + "{" + parts.join(", ") + (keys.length > 100 ? ", \\u2026" : "") + "}";
    } catch (err) {
      return String(value);
    } finally {
      seen.pop();
    }
  }

  function send(level, args) {
    try {
      var out = [];
      for (var i = 0; i < args.length; i++) out.push(fmt(args[i], [], 0));
      var text = out.join(" ");
      if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN) + "\\u2026 (truncated)";
      window.parent.postMessage({ type: TYPE, level: level, text: text, timestamp: Date.now() }, PARENT_ORIGIN);
    } catch (err) {
      /* never let logging break the app */
    }
  }

  var LEVELS = ["log", "info", "warn", "error", "debug"];
  for (var k = 0; k < LEVELS.length; k++) {
    (function (level) {
      var original = typeof console[level] === "function" ? console[level].bind(console) : function () {};
      console[level] = function () {
        send(level, arguments);
        original.apply(console, arguments);
      };
    })(LEVELS[k]);
  }

  window.addEventListener("error", function (event) {
    var where = event.filename ? "\\n    at " + event.filename + ":" + event.lineno + ":" + event.colno : "";
    send("error", [(event.message || "Uncaught error") + where]);
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var text = reason && reason.stack ? reason.stack : fmt(reason, [], 0);
    send("error", ["Uncaught (in promise) " + text]);
  });
})();
`.trim();
}

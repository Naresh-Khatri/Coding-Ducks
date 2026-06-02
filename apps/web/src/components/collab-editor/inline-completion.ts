import type { Extension } from "@codemirror/state";
import { Prec, StateEffect, StateField } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
} from "@codemirror/view";

/**
 * Backend-agnostic inline (ghost-text) completion for CodeMirror 6.
 *
 * This deliberately knows nothing about the model behind it — you hand it a
 * `fetchFn(prefix, suffix)` and it handles the editor side: debounced requests,
 * request cancellation, the dimmed ghost-text decoration, and Tab-to-accept.
 * Swapping providers (Codestral → self-hosted llama.cpp → anything) is a change
 * to `fetchFn` only; this file never changes.
 *
 * CRDT-safe by construction: the suggestion lives in a StateField + widget
 * decoration, never in the document, so it is never written to the shared
 * Y.Text. Only the *accepted* edit hits the doc, and that syncs to
 * collaborators like any other change.
 */

export interface InlineCompletionContext {
  /** Document text before the cursor. */
  prefix: string;
  /** Document text after the cursor. */
  suffix: string;
  /** Cursor offset in the document. */
  pos: number;
}

export interface InlineCompletionOptions {
  /**
   * Fetch a completion for the given context. Return "" (or whitespace) for
   * "no suggestion". The signal aborts when the user types again — honour it.
   */
  fetchFn: (
    ctx: InlineCompletionContext,
    signal: AbortSignal,
  ) => Promise<string>;
  /** Debounce before requesting, in ms. Default 300. */
  delay?: number;
}

interface Suggestion {
  text: string;
  /** Document position the ghost text is anchored at. */
  pos: number;
}

const setSuggestion = StateEffect.define<Suggestion | null>();

/**
 * Dispatched by the manual-trigger keybinding (Alt-\) to request a completion
 * at the cursor immediately, bypassing the typing filter and debounce.
 */
const requestNow = StateEffect.define<null>();

class GhostTextWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: GhostTextWidget) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-ghost-text";
    span.textContent = this.text;
    return span;
  }
}

const suggestionField = StateField.define<Suggestion | null>({
  create() {
    return null;
  },
  update(value, tr) {
    // A setSuggestion effect always wins (this is how we set/clear it).
    for (const e of tr.effects) {
      if (e.is(setSuggestion)) return e.value;
    }
    // Any edit or caret move while a suggestion is showing invalidates it.
    // (The transaction that *sets* the suggestion carries no doc change, so it
    // doesn't fall through to here.)
    if (tr.docChanged || tr.selection) return null;
    return value;
  },
  provide: (f) =>
    EditorView.decorations.from(f, (value) => {
      if (!value) return Decoration.none;
      return Decoration.set([
        Decoration.widget({
          widget: new GhostTextWidget(value.text),
          side: 1,
        }).range(value.pos),
      ]);
    }),
});

function completionFetcher(options: InlineCompletionOptions) {
  const delay = options.delay ?? 300;
  return ViewPlugin.fromClass(
    class {
      timeout: ReturnType<typeof setTimeout> | null = null;
      controller: AbortController | null = null;

      update(update: ViewUpdate) {
        // Manual trigger (Alt-\): complete at the cursor now, regardless of
        // whether the user just typed. Cancels any pending/in-flight request
        // and fires immediately.
        if (
          update.transactions.some((tr) =>
            tr.effects.some((e) => e.is(requestNow)),
          )
        ) {
          this.cancel();
          void this.request(update.view);
          return;
        }

        if (!update.docChanged) return;
        // Skip while composing via IME — the intermediate keystrokes of a
        // CJK/accent composition would each fire a wasted request.
        if (update.view.composing) return;
        // Only request on genuine local typing. `input.type` is present for
        // user-typed characters but NOT for:
        //   • remote collaborator edits (yCollab dispatches its own annotation)
        //   • undo / redo (and our own accept dispatch — they carry no
        //     `input.type` user event)
        //   • deletions and pastes
        // So we ask the model only when the user is actively typing new text,
        // never echoing a teammate's keystrokes or re-firing after an accept.
        const typed = update.transactions.some((tr) =>
          tr.isUserEvent("input.type"),
        );
        if (typed) this.schedule(update.view);
      }

      schedule(view: EditorView) {
        this.cancel();
        this.timeout = setTimeout(() => void this.request(view), delay);
      }

      cancel() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = null;
        this.controller?.abort();
        this.controller = null;
      }

      async request(view: EditorView) {
        const sel = view.state.selection.main;
        // No completion with a ranged selection or an unfocused editor.
        if (!sel.empty || !view.hasFocus) return;

        const pos = sel.head;
        const doc = view.state.doc.toString();
        this.controller = new AbortController();
        const { signal } = this.controller;

        try {
          const text = await options.fetchFn(
            { prefix: doc.slice(0, pos), suffix: doc.slice(pos), pos },
            signal,
          );
          if (signal.aborted) return;
          // Bail if the caret moved or selection changed while we waited.
          const cur = view.state.selection.main;
          if (!cur.empty || cur.head !== pos) return;
          view.dispatch({
            effects: setSuggestion.of(text.trim() ? { text, pos } : null),
          });
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            console.warn("[ai-completion] fetch failed", err);
          }
        }
      }

      destroy() {
        this.cancel();
      }
    },
  );
}

const completionKeymap = Prec.highest(
  keymap.of([
    {
      key: "Tab",
      run: (view) => {
        const s = view.state.field(suggestionField, false);
        if (!s) return false; // no suggestion → let Tab indent as usual
        view.dispatch({
          changes: { from: s.pos, insert: s.text },
          selection: { anchor: s.pos + s.text.length },
          effects: setSuggestion.of(null),
        });
        return true;
      },
    },
    {
      key: "Escape",
      run: (view) => {
        if (!view.state.field(suggestionField, false)) return false;
        view.dispatch({ effects: setSuggestion.of(null) });
        return true;
      },
    },
    {
      // Manual "complete here now" — works without typing (e.g. after clicking
      // to reposition the caret), bypassing the debounce.
      key: "Alt-\\",
      run: (view) => {
        view.dispatch({ effects: requestNow.of(null) });
        return true;
      },
    },
  ]),
);

const ghostTheme = EditorView.baseTheme({
  ".cm-ghost-text": {
    opacity: "0.4",
    // Honour newlines in multi-line suggestions.
    whiteSpace: "pre-wrap",
  },
});

export function inlineCompletion(options: InlineCompletionOptions): Extension {
  return [
    suggestionField,
    completionFetcher(options),
    completionKeymap,
    ghostTheme,
  ];
}

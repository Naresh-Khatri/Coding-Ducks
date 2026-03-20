"use client";

import { useCallback, useMemo } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { indentRange, StreamLanguage } from "@codemirror/language";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";

export type Language =
  | "py"
  | "js"
  | "ts"
  | "java"
  | "cpp"
  | "c"
  | "rs"
  | "go"
  | "rb"
  | "php";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  height?: string;
  className?: string;
  editorRef?: React.RefObject<ReactCodeMirrorRef | null>;
  onSave?: () => void;
  onRun?: () => void;
  onSubmit?: () => void;
}

const languageExtensions = {
  py: () => python(),
  js: () => javascript(),
  ts: () => javascript({ typescript: true }),
  java: () => java(),
  cpp: () => cpp(),
  c: () => cpp(),
  rs: () => rust(),
  go: () => go(),
  rb: () => StreamLanguage.define(ruby),
  php: () => php(),
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "400px",
  className,
  editorRef,
  onSave,
  onRun,
  onSubmit,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const langExt = languageExtensions[language];
    return [
      langExt(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height },
        ".cm-scroller": { overflow: "auto" },
      }),
      keymap.of([
        {
          key: "Mod-s",
          run: (view) => {
            const { doc } = view.state;
            const changes = indentRange(view.state, 0, doc.length);
            if (changes) view.dispatch({ changes });
            onSave?.();
            return true;
          },
        },
        {
          key: "Mod-Enter",
          run: () => {
            onRun?.();
            return true;
          },
        },
        {
          key: "Mod-Shift-Enter",
          run: () => {
            onSubmit?.();
            return true;
          },
        },
      ]),
    ];
  }, [language, height, onSave, onRun, onSubmit]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={oneDark}
      readOnly={readOnly}
      className={className}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
    />
  );
}

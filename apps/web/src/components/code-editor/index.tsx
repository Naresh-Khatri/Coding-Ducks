"use client";

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { StreamLanguage } from "@codemirror/language";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

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
    ];
  }, [language, height]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
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

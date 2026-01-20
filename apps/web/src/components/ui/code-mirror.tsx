"use client";

import React from "react";
import CodeMirror, { Extension } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
  height?: string;
}

const getLanguageExtension = (lang: string): Extension => {
  switch (lang) {
    case "py":
    case "python":
      return python();
    case "js":
    case "javascript":
      return javascript();
    case "java":
      return java();
    case "cpp":
    case "c":
      return cpp();
    default:
      return python();
  }
};

export function CodeEditor({
  value,
  onChange,
  language,
  className,
  height = "400px",
}: CodeEditorProps) {
  return (
    <div className={className}>
      <CodeMirror
        value={value}
        height={height}
        theme={vscodeDark}
        extensions={[getLanguageExtension(language)]}
        onChange={onChange}
        className="border rounded-md overflow-hidden text-sm"
      />
    </div>
  );
}

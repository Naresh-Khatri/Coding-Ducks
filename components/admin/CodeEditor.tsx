import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-terminal";

import "ace-builds/src-noconflict/ext-language_tools";
import { FC } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  lang: "javascript" | "python" | "java" | "c_cpp";
  theme: "default" | "dracula" | "github" | "monokai" | "terminal";
  fontSize: number;
}

const CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  fontSize,
  lang,
  theme,
}) => {
  return (
    <>
      <AceEditor
        mode={lang}
        value={value}
        onChange={onChange}
        theme={theme}
        fontSize={fontSize}
        name="my-editor"
        width="100%"
        height="300px"
      />
    </>
  );
};

export default CodeEditor;

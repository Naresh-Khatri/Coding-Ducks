import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/ext-language_tools";

import { IAceModes, Lang, Theme } from "../types";

interface AceCodeEditorProps {
  code: string;
  fontSize: number;
  setCode: (value: string) => void;
  theme: Theme;
  lang: Lang;
}

const langToAceMode: { [key in Lang]: IAceModes } = {
  js: "javascript",
  py: "python",
  java: "java",
  c: "c_cpp",
  cpp: "c_cpp",
  other: 'javascript'
};

function AceCodeEditor({
  code,
  setCode,
  lang,
  theme,
  fontSize,
}: AceCodeEditorProps) {
  return (
    <>
      <AceEditor
        mode={langToAceMode[lang]}
        value={code}
        onChange={(value) => setCode(value)}
        theme={theme}
        editorProps={{ $blockScrolling: true }}
        fontSize={fontSize}
        width="100%"
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
        }}
      />
    </>
  );
}
export default AceCodeEditor;

import { FC } from "react";
import BaseAceEditor from "../editors/BaseAceEditor";

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
      <BaseAceEditor
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

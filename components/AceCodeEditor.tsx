import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";

import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-terminal";

import "ace-builds/src-noconflict/ext-language_tools";

import { Flex } from "@chakra-ui/react";

import WindowHeader from "./WindowHeader";
import { Lang, Theme } from "../types";
import { useEffect, useRef } from "react";
import { IAceEditor } from "react-ace/lib/types";
import { Range } from "ace-builds";
import { langToAceModes } from "../lib/utils";

interface AceCodeEditorProps {
  code: string;
  fontSize: number;
  setCode: (value: string) => void;
  theme: Theme;
  lang: Lang;
  problemId: number;
  starterCode?: string;
  runCode?: () => void;
  errorIndex?: number;
}

function AceCodeEditor({
  code,
  setCode,
  lang,
  theme,
  fontSize,
  starterCode,
  errorIndex,
  problemId,
}: AceCodeEditorProps) {
  const editorRef = useRef<AceEditor>(null);

  useEffect(() => {
    const ccode =
      localStorage.getItem(`code-${problemId}-${lang}`) || starterCode || "";
    setCode(ccode);
    setTimeout(() => {
      foldStarterCode(editorRef.current.editor);
    }, 10);
  }, [lang]);

  useEffect(() => {
    handleOnChange(code);
  }, [code]);
  const foldStarterCode = (editor: IAceEditor) => {
    // get the lines with 🦆 and make pairs
    const lines = editorRef.current.editor.session.getDocument()[
      "$lines"
    ] as string[];
    const pairs = lines.reduce((acc, curr, idx) => {
      if (curr.includes("🦆")) {
        if (acc.at(-1)?.length === 1)
          return [...acc.slice(0, -1), [...acc.at(-1), idx]];
        else return [...acc, [idx]];
      }
      return acc;
    }, []);

    // remove old markers if any
    Object.values(editor.session.getMarkers(true)).forEach((marker) => {
      if (marker.clazz === "ace-startercode-highlight")
        editor.session.removeMarker(marker.id as number);
    });

    pairs.forEach((pair) => {
      const range = new Range(pair[0], 3, pair[1], 3);
      // fold the lines
      editor.session.addFold("🦆", range);
      // highlight the lines
      editor.session.addMarker(
        range,
        "ace-startercode-highlight",
        "fullLine",
        true
      );
    });
  };
  //TODO: optimize these pieces of shit codes
  const handleOnChange = (newCode: string) => {
    if (newCode.trim() === "") return;
    foldStarterCode(editorRef.current.editor);
    setCode(newCode);
    localStorage.setItem(`code-${problemId}-${lang}`, newCode);
  };
  const placeErrorMarker = () => {
    if (!editorRef.current) return;
    Object.values(editorRef.current.editor.session.getMarkers(true)).forEach(
      (marker) => {
        if (marker.clazz === "ace-error-highlight")
          editorRef.current.editor.session.removeMarker(marker.id as number);
      }
    );
    if (errorIndex > 0) {
      editorRef.current.editor.session.addMarker(
        new Range(errorIndex - 1, 0, errorIndex - 1, 10),
        "ace-error-highlight",
        "fullLine",
        true
      );
      editorRef.current.editor.scrollToLine(errorIndex, true, true, () => {});
    }
  };
  placeErrorMarker();
  return (
    <Flex
      direction={"column"}
      my={2}
      w={"100%"}
      style={{
        border: "1px solid rgba(255,255,255,.125)",
        borderRadius: "10px",
      }}
    >
      <WindowHeader title={"editor.exe"} status={"none"} />
      <AceEditor
        mode={langToAceModes[lang]}
        value={code}
        onChange={(value) => setCode(value)}
        theme={theme}
        editorProps={{
          $blockScrolling: false,
        }}
        ref={editorRef}
        fontSize={fontSize}
        width="100%"
        height="100%"
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
        }}
      />
    </Flex>
  );
}
export default AceCodeEditor;

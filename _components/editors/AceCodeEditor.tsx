import { useContext, useEffect, useRef } from "react";

import AceEditor from "react-ace";
import { IAceEditor } from "react-ace/lib/types";
import { Range } from "ace-builds";

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
import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/keybinding-sublime";
import "ace-builds/src-noconflict/keybinding-vscode";

import { Flex } from "@chakra-ui/react";

import WindowHeader from "../WindowHeader";
import { langToAceModes } from "../../lib/utils";
import { EditorSettingsContext } from "../../contexts/editorSettingsContext";
import { useRouter } from "next/router";
import { Lang } from "types";

interface AceCodeEditorProps {
  problemId: number;
  starterCode?: string;
  runCode?: () => void;
  allowPadding?: boolean;
  errorIndex?: number;
  hideHeader?: boolean;
}

function AceCodeEditor({
  starterCode,
  errorIndex,
  allowPadding,
  problemId,
  hideHeader,
}: AceCodeEditorProps) {
  const editorRef = useRef<AceEditor>(null);
  const { settings, code, setCode, isLoading } = useContext(
    EditorSettingsContext
  );
  const router = useRouter();

  /**
   *
   * in playground take code from qp
   * in editor take code from local storage
   *
   */
  let lang: Lang;
  if (router.pathname === "/playground") {
    lang = (router.query as { lang: Lang }).lang;
  } else {
    lang = settings.lang;
  }

  const { theme, keyBindings, allowAutoComplete, fontSize, tabSize } = settings;

  // set keybindings
  useEffect(() => {
    if (keyBindings === "default")
      editorRef.current?.editor.setKeyboardHandler(null);
    else if (keyBindings === "vim")
      import("ace-builds/src-noconflict/keybinding-vim").then((module) => {
        editorRef.current?.editor.setKeyboardHandler(module.handler);
      });
    else if (keyBindings === "emacs")
      import("ace-builds/src-noconflict/keybinding-emacs").then((module) => {
        editorRef.current?.editor.setKeyboardHandler(module.handler);
      });
    else if (keyBindings === "sublime")
      import("ace-builds/src-noconflict/keybinding-sublime").then((module) => {
        editorRef.current?.editor.setKeyboardHandler(module.handler);
      });
    else if (keyBindings === "vscode")
      import("ace-builds/src-noconflict/keybinding-vscode").then((module) => {
        editorRef.current?.editor.setKeyboardHandler(module.handler);
      });
  }, [keyBindings]);

  // set lang
  useEffect(() => {
    if (isLoading) return;
    const ccode =
      localStorage.getItem(`code-${problemId}-${lang}`) || starterCode || "";
    setCode(ccode);
    setTimeout(() => {
      if (editorRef.current?.editor) foldStarterCode(editorRef.current.editor);
    }, 10);
  }, [lang, problemId, isLoading]);

  // set code
  useEffect(() => {
    if (code === "") return;
    handleOnChange(code);
  }, [code]);

  const foldStarterCode = (editor: IAceEditor) => {
    if (!editorRef.current) return;
    // get the lines with 🦆 and make pairs
    const lines = editorRef.current.editor.session.getDocument()[
      "$lines"
    ] as string[];
    const pairs = lines.reduce((acc, curr, idx) => {
      if (curr.includes("🦆")) {
        if (acc.at(-1) && acc.at.length === 1)
          // @ts-ignore
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
    if (!editorRef.current || isLoading) return;
    localStorage.setItem(`code-${problemId}-${lang}`, newCode);
    setCode(newCode);
    foldStarterCode(editorRef.current.editor);
  };
  const placeErrorMarker = () => {
    if (!editorRef.current || !errorIndex) return;
    Object.values(editorRef.current.editor.session.getMarkers(true)).forEach(
      (marker) => {
        if (marker.clazz === "ace-error-highlight")
          // @ts-ignore
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
  if (!lang) return null;
  return (
    <Flex
      direction={"column"}
      py={allowPadding ? 2 : 0}
      w={"100%"}
      h={"100%"}
      style={{
        border: "1px solid rgba(255,255,255,.125)",
        borderRadius: "10px",
      }}
    >
      {!hideHeader && <WindowHeader title={"editor.exe"} status={"none"} />}
      <AceEditor
        mode={langToAceModes[lang]}
        value={code}
        onChange={(value) => handleOnChange(value)}
        theme={theme}
        editorProps={{
          $blockScrolling: false,
        }}
        ref={editorRef}
        width="100%"
        height="100%"
        keyboardHandler="vim"
        setOptions={{
          enableBasicAutocompletion: allowAutoComplete,
          enableLiveAutocompletion: allowAutoComplete,
          enableSnippets: true,
          showLineNumbers: true,
          fontSize: fontSize,
          tabSize: tabSize,
        }}
      />
    </Flex>
  );
}
export default AceCodeEditor;

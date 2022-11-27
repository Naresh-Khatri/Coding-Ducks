import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { keymap } from "@codemirror/view";

import { dracula } from "@uiw/codemirror-theme-dracula";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { duotoneDark, duotoneLight } from "@uiw/codemirror-theme-duotone";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import WindowHeader from "./WindowHeader";

// import "./CodeEditor.css";

function CodeEditor({ code, setCode, lang, theme, runCode }) {
  const supportedLangs = {
    py: python(),
    js: javascript(),
    cpp: cpp(),
    c: cpp(),
    java: java(),
  };
  const supportedThemes = {
    dracula: dracula,
    atomone: atomone,
    eclipse: eclipse,
    okaidia: okaidia,
    githubDark: githubDark,
    githubLight: githubLight,
    duotoneDark: duotoneDark,
    duotoneLight: duotoneLight,
    xcodeDark: xcodeDark,
    xcodeLight: xcodeLight,
  };
  const saveCode = () => {
    console.log("saving file");
  };
  const shortcuts = [
    {
      key: "Ctrl-Enter",
      preventDefault: true,
      run: () => {
        runCode();
        return true;
      },
    },
    {
      key: "Shift-Ctrl-S",
      preventDefault: true,
      run: () => {
        saveCode();
        return true;
      },
    },
  ];
  const save = (e) => {
    console.log("save", e);
  };
  return (
    <Flex direction={"column"} my={2} >
      <WindowHeader title={"editor.exe"} />
      <CodeMirror
        autoFocus
        value={code}
        height="40vh"
        style={{ fontSize: "1.2rem" }}
        basicSetup={{ defaultKeymap: false }}
        theme={supportedThemes[theme]}
        // extensions={[loadLanguage('cpp')]}
        extensions={[keymap.of(shortcuts), supportedLangs[lang]]}
        onChange={(value) => {
          setCode(value);
        }}
      />
    </Flex>
  );
}
export default CodeEditor;

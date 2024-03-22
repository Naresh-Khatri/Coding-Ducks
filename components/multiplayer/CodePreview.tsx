import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";

import "ace-builds/src-noconflict/theme-dracula";
import { langToAceModes } from "../../lib/utils";

import React from "react";
import AceEditor from "react-ace";
import { Lang } from "../../types";

const CodePreview = ({ code, lang }: { code: string; lang: Lang }) => {
  return (
    // <AceEditor
    //   mode={langToAceModes[lang]}
    //   value={code}
    //   width="100%"
    //   height="100%"
    //   keyboardHandler="vim"
    //   setOptions={{
    //     fontSize: 10,
    //   }}
    // />

    <AceEditor
      mode={langToAceModes[lang]}
      readOnly
      onLoad={(editor) => {
        editor.renderer.setPadding(20);
        editor.setFontSize(16);
      }}
      style={{ borderRadius: "10px" }}
      width="100%"
      height="20rem"
      focus={false}
      theme="dracula"
      showGutter={false}
      fontSize={10}
      value={'slkfj'}
    />
  );
};

export default CodePreview;

import { Dispatch, SetStateAction } from "react";
import ReactCodeMirror, { EditorView, Extension } from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { LanguageSupport, indentUnit } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { useEditorSettingsStore } from "stores";
import { vim } from "@replit/codemirror-vim";

type Lang = "html" | "css" | "js";
const CMEditor = ({
  value,
  setValue,
  lang,
}: {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  lang: Lang;
}) => {
  const fontSize = useEditorSettingsStore((state) => state.fontSize);
  const vimEnabled = useEditorSettingsStore((state) => state.vimEnabled);

  let extensions: (LanguageSupport | Extension)[] = [];
  extensions.push(indentUnit.of("  "));
  extensions.push(EditorView.lineWrapping);

  if (vimEnabled) extensions.push(vim());

  if (lang === "html") {
    extensions.push(html());
  } else if (lang === "css") {
    extensions.push(css());
  } else {
    extensions.push(javascript());
  }
  return (
    <ReactCodeMirror
      style={{ width: "100%", fontSize: fontSize + "px" }}
      value={value}
      onChange={(e) => setValue(e)}
      extensions={extensions}
      theme={dracula}
      key={lang}
    />
  );
};
export default CMEditor;

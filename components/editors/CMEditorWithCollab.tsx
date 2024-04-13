import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { vim } from "@replit/codemirror-vim";
import { dracula } from "@uiw/codemirror-theme-dracula";
import ReactCodeMirror, { EditorView } from "@uiw/react-codemirror";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { LanguageSupport } from "@codemirror/language";
import { WebsocketProvider } from "y-websocket";

type Lang = "head" | "html" | "css" | "js";

const CMEditorWithCollab = ({
  yDoc,
  lang,
  provider,
}: {
  yDoc: Y.Doc;
  lang: Lang;
  provider: WebsocketProvider;
}) => {
  let value: string;
  let placeholder = "";
  const extensions: LanguageSupport[] = [];

  const undoManager = new Y.UndoManager(
    yDoc.getText(`content${String(lang).toUpperCase()}`)
  );
  switch (lang) {
    case "head": {
      value = yDoc.getText("contentHEAD").toJSON();
      extensions.push(html());
      break;
    }
    case "html": {
      value = yDoc.getText("contentHTML").toJSON();
      extensions.push(html());
      if (value.trim().length === 0) placeholder = "<h1>Hello World</h1>";
      break;
    }
    case "css": {
      value = yDoc.getText("contentCSS").toJSON();
      extensions.push(css());
      if (value.trim().length === 0) placeholder = "h1 { color: red; }";
      break;
    }
    case "js": {
      value = yDoc.getText("contentJS").toJSON();
      extensions.push(javascript());
      if (value.trim().length === 0) placeholder = "console.log('Hello world')";
      break;
    }
  }
  // console.log(lang, value);
  // if (!provider) return <Spinner />;
  return (
    <ReactCodeMirror
      value={value}
      style={{ width: "100%" }}
      key={lang}
      theme={dracula}
      extensions={[
        ...extensions,
        EditorView.lineWrapping,
        vim(),
        yCollab(
          yDoc.getText(`content${String(lang).toUpperCase()}`),
          provider.awareness,
          { undoManager }
        ),
      ]}
      placeholder={placeholder}
    />
  );
};
export default CMEditorWithCollab;

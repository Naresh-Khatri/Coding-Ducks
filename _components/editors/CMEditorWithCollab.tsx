import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { vim } from "@replit/codemirror-vim";
import { dracula } from "@uiw/codemirror-theme-dracula";
import ReactCodeMirror, { EditorView, Extension } from "@uiw/react-codemirror";
import { yCollab } from "y-codemirror.next";
import { UndoManager } from "yjs";
import { Skeleton, Stack, Text, VStack } from "@chakra-ui/react";
import { useDuckletStore, useEditorSettingsStore } from "../../stores";

type Lang = "head" | "html" | "css" | "js";

const CMEditorWithCollab = ({ lang }: { lang: Lang }) => {
  const provider = useDuckletStore((state) => state.provider);
  const yDoc = useDuckletStore((state) => state.yDoc);
  const yjsConnected = useDuckletStore((state) => state.yjsConnected);

  const fontSize = useEditorSettingsStore((state) => state.fontSize);
  const vimEnabled = useEditorSettingsStore((state) => state.vimEnabled);

  let value: string;
  let placeholder = "";
  const extensions: Extension[] = [];
  if (vimEnabled) extensions.push(vim());

  const undoManager = new UndoManager(
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
  if (!yjsConnected || !provider)
    return (
      <Stack w={"100%"} mt={1}>
        {Array(Math.ceil(Math.random() * 10))
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={i}
              height="20px"
              width={Math.ceil(Math.random() * 100) + "%"}
            />
          ))}
      </Stack>
    );
  const yText = yDoc.getText(`content${String(lang).toUpperCase()}`);
  return (
    <>
      <VStack w={"100%"}>
        {vimEnabled && <div>{yText.toJSON()}</div>}

        {yText.toJSON() !== "" && (
          <div style={{ height: "100%", width: "100%" }}>
            <ReactCodeMirror
              style={{ width: "100%", fontSize: fontSize + "px" }}
              key={lang}
              theme={dracula}
              extensions={[
                ...extensions,
                EditorView.lineWrapping,
                yCollab(yText, provider.awareness, { undoManager }),
              ]}
              placeholder={placeholder}
            />
          </div>
        )}
      </VStack>
    </>
  );
};
export default CMEditorWithCollab;

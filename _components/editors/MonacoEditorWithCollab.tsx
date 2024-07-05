import Editor from "@monaco-editor/react";
import "monaco-themes/themes/Dracula.json";
import { initVimMode } from "monaco-vim";
import { MonacoBinding } from "y-monaco";

import { Skeleton, Stack, Text, VStack } from "@chakra-ui/react";
import { useDuckletStore, useEditorSettingsStore } from "../../stores";
import { useState } from "react";

type Lang = "head" | "html" | "css" | "js";

const MonacoEditorWithCollab = ({ lang }: { lang: Lang }) => {
  const provider = useDuckletStore((state) => state.provider);
  const yDoc = useDuckletStore((state) => state.yDoc);
  const yjsConnected = useDuckletStore((state) => state.yjsConnected);

  const fontSize = useEditorSettingsStore((state) => state.fontSize);
  const vimEnabled = useEditorSettingsStore((state) => state.vimEnabled);

  const yText = yDoc.getText(`content${String(lang).toUpperCase()}`);

  const [loading, setLoading] = useState(true);

  async function handleEditorDidMount(editor: any, monaco: any) {
    if (!provider) return;
    const themeData = await import("monaco-themes/themes/Dracula.json");
    monaco.editor.defineTheme("dracula", themeData);
    monaco.editor.setTheme("dracula");

    if (vimEnabled) initVimMode(editor /*statusTextRef.current*/);

    const foo = document.querySelector(".view-lines");
    // @ts-ignore
    foo?.setAttribute("contenteditable", "true");
    const monacoBinding = new MonacoBinding(
      yText,
      /** @type {monaco.editor.ITextModel} */ editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    setLoading(false);
  }
  if (!yjsConnected || !provider) {
    return (
      <Stack w={"100%"} h={"100%"} mt={1} display={loading ? "flex" : "none"}>
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
  }

  return (
    <>
      <Stack w={"100%"} h={"100%"} mt={1} display={loading ? "flex" : "none"}>
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
      <VStack w={"100%"} h={"100%"} display={loading ? "none" : "flex"}>
        <Editor
          theme="vs-dark"
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            fontSize,
          }}
          defaultLanguage={
            lang === "js" ? "javascript" : lang === "head" ? "html" : lang
          }
          onMount={handleEditorDidMount}
        />
      </VStack>
    </>
  );
};
export default MonacoEditorWithCollab;

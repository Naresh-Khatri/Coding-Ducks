import React, { useEffect, useState } from "react";
import { Doc, Transaction } from "yjs";

import { ISocketRoom } from "../../../lib/socketio/socketEvents";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import Split from "react-split";
import FileIcons from "../FileIcons";

import { LanguageSupport } from "@codemirror/language";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import dynamic from "next/dynamic";
import { debounce } from "../../../lib/utils";
import useGlobalStore from "../../../stores";
import { yCollab } from "y-codemirror.next";
import { vim } from "@replit/codemirror-vim";
import { WebsocketProvider } from "y-websocket";
// import { useMutateRoomYDoc } from "hooks/useRoomsData";
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

interface IMultiplayerWebProps {
  room: ISocketRoom;
}

type Lang = "html" | "css" | "js";
interface CodeAction {
  type: Lang;
  code: string;
}

function MultiplayerWeb({ room }: IMultiplayerWebProps) {
  const yDoc = useGlobalStore((state) => state.yDoc);

  const [srcDoc, setSrcDoc] = useState("Loading...");
  const [provider, setProvider] = useState<WebsocketProvider>();

  // const { mutate } = useMutateRoomYDoc();
  console.log(room);

  useEffect(() => {
    const provider = new WebsocketProvider(
      process.env.NODE_ENV === "development"
        ? "ws://localhost:3334"
        : "wss://yjs.codingducks.xyz",
      "room:" + room.id,
      yDoc
    );
    console.log(room);
    // Y.applyUpdate(yDoc, new Uint8Array(room.yDoc));

    yDoc.on(
      "update",
      (update: Uint8Array, origin: any, doc: Doc, tr: Transaction) => {
        const _html = doc.getText("contentHTML").toJSON();
        const _css = doc.getText("contentCSS").toJSON();
        const _js = doc.getText("contentJS").toJSON();

        renderView({ contentHTML: _html, contentCSS: _css, contentJS: _js });
      }
    );
    provider.on("status", (status) => {
      console.log(status);
      if (status === "connected") {
        // Y.applyUpdate(yDoc, new Uint8Array(room.yDoc));
      }
    });
    setProvider(provider);
    return () => {
      if (provider) provider.destroy();
      if (yDoc) yDoc.destroy();
    };
  }, []);

  const renderView = debounce(
    ({
      contentCSS,
      contentHTML,
      contentJS,
    }: {
      contentHTML: string;
      contentCSS: string;
      contentJS: string;
    }) => {
      setSrcDoc(
        `<html>
        <body>${contentHTML}</body>
        <style>${contentCSS}</style>
        <script>${contentJS}</script>
        </html>`
      );
      console.log("will update");
      // mutate(
      //   {
      //     roomId: room.id,
      //     contents: Buffer.from(Y.encodeStateAsUpdate(yDoc)),
      //   },
      //   {
      //     onSettled(data, error, variables, context) {
      //       console.log("ydoc stored");
      //       // console.log(Y.decodeUpdate(data.yDoc), Y.encodeStateAsUpdate(yDoc));
      //       // console.log(
      //       //   typeof new Uint8Array(data.yDoc),
      //       //   typeof Y.encodeStateAsUpdate(yDoc)
      //       // );
      //     },
      //   }
      // );
    },
    1000
  );
  if (!provider) return <p>Loading...</p>;

  return (
    <Box
      width={"100vw"}
      h={"100dvh"}
      //   bg={"#282A36"}
    >
      {/* <Button
        onClick={() => {
          const updates = Y.encodeStateAsUpdate(yDoc);
          console.log(updates)
          Y.applyUpdate(yDoc, new Uint8Array(updates))
        }}
      >
        encoke
      </Button> */}
      <Split
        style={{ height: "100%", width: "100%" }}
        direction="vertical"
        minSize={200}
        sizes={[40, 60]}
      >
        <Box h={"full"}>
          <Split
            className="split-h"
            minSize={0}
            snapOffset={50}
            style={{ width: "100%", height: "100%" }}
          >
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="html" />
              <CMEditor yDoc={yDoc} provider={provider} lang={"html"} />
            </Flex>
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="css" />
              <CMEditor yDoc={yDoc} provider={provider} lang={"css"} />
            </Flex>
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="js" />
              <CMEditor yDoc={yDoc} provider={provider} lang={"js"} />
            </Flex>
          </Split>
        </Box>
        <Box w={"full"} bg={"white"} h={"full"}>
          <iframe
            title="output"
            sandbox="allow-scripts"
            width={"100%"}
            height={"100%"}
            srcDoc={srcDoc}
          ></iframe>
        </Box>
      </Split>
    </Box>
  );
}

export default MultiplayerWeb;
const CMEditor = ({
  yDoc,
  lang,
  provider,
}: {
  yDoc: Doc;
  lang: Lang;
  provider: WebsocketProvider;
}) => {
  const extensions: LanguageSupport[] = [];
  if (lang === "html") extensions.push(html());
  if (lang === "css") extensions.push(css());
  if (lang === "js") extensions.push(javascript());
  return (
    <>
      <CodeMirror
        style={{ width: "100%", height: "100%" }}
        key={lang}
        theme={dracula}
        extensions={[
          ...extensions,
          vim(),
          yCollab(
            yDoc.getText(`content${String(lang).toUpperCase()}`),
            provider.awareness
          ),
        ]}
      />
    </>
  );
};

const FileBadge = ({ fileType }: { fileType: Lang }) => {
  return (
    <Box pos={"absolute"} top={0} right={0} zIndex={3}>
      <HStack
        my={1}
        px={2}
        py={1}
        borderRadius={"5px"}
        bg={"#282A36"}
        w={"fit-content"}
      >
        <FileIcons fileName={`index.${fileType}`} width={20} />
        <Text fontWeight={"bold"} fontSize={"x-small"} casing={"uppercase"}>
          {fileType}
        </Text>
      </HStack>
    </Box>
  );
};

"use client";
import { Box, Button, Flex, Textarea } from "@chakra-ui/react";
import React, { use, useEffect, useState } from "react";
import * as Y from "yjs";
import CMEditorWithCollab from "../../components/editors/CMEditorWithCollab";
import { SocketIOProvider } from "y-socket.io";
import { Socket, io } from "socket.io-client";
import { useRoomData } from "../../hooks/useRoomsData";

const doc1 = new Y.Doc();
const doc2 = new Y.Doc();

function YjsCollab() {
  const [provider1, setProvider1] = useState<SocketIOProvider>();
  const [provider2, setProvider2] = useState<SocketIOProvider>();
  const [textArea1, setTextArea1] = useState("");
  const [update, setUpdate] = useState<Uint8Array>();
  const [socket, setSocket] = useState<Socket>();
  const { data, isLoading } = useRoomData({ id: 9 });
  console.log(data);
  useEffect(() => {
    if (!data) return;
    const _provider1 = new SocketIOProvider(
      "http://localhost:3333",
      "doc1",
      doc1,
      { autoConnect: true }
    );
    const _provider2 = new SocketIOProvider(
      "http://localhost:3333",
      "doc2",
      doc2,
      { autoConnect: true }
    );
    setProvider1(_provider1);
    setProvider2(_provider2);
    const _socket = io("http://localhost:3333");
    _socket.on("test", (data) => {
      console.log(data);
    });
    setSocket(_socket);
  }, [data]);

  if (!provider1 || !provider2) return <p>Providing...</p>;
  return (
    <>
      <Flex w={"100vh"} h={"100dvh"}>
        <Flex w={"50vh"} h={"100dvh"}>
          <Button
            onClick={() => {
              if (data?.yDoc) {
                console.log(data?.yDoc);
                Y.applyUpdate(doc2, data?.yDoc);
              }
              // doc1.getText("text").insert(0, textArea1);
              // const update = Y.encodeStateAsUpdateV2(doc1);
              // setUpdate(update);
              // Y.applyUpdate(doc2, update);
            }}
          >
            encode
          </Button>
          <Textarea
            value={textArea1}
            onChange={(e) => setTextArea1(e.target.value)}
          />
          {/* <CMEditorWithCollab yDoc={doc1} lang="html" provider={provider1} /> */}
        </Flex>
        <Flex w={"50vh"} h={"100dvh"}>
          {/* <Textarea
            value={doc2.getText("text1").toJSON()}
            // onChange={(e) => setTextArea2(e.target.value)}
          /> */}
          <CMEditorWithCollab yDoc={doc2} lang="html" provider={provider2} />
        </Flex>
      </Flex>
    </>
  );
}

export default YjsCollab;

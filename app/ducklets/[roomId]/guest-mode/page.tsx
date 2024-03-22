"use client";
import React, {
  Dispatch,
  SetStateAction,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Spinner,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import Split from "react-split";
import { FileBadge } from "../../../../components/ducklets/FileBadge";
import ReactCodeMirror, { Extension, keymap } from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { LanguageSupport, indentUnit } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

import { useRoomData } from "../../../../hooks/useRoomsData";
import { useParams, useRouter } from "next/navigation";
import { userContext } from "../../../../contexts/userContext";

import IFrameRenderer from "../../../../components/ducklets/IFrameRenderer";

function GuestModeDuckletPage() {
  const { user, userLoaded } = use(userContext);
  const { roomId } = useParams() as { roomId: string };
  const { data: currRoom, isLoading } = useRoomData({ id: +roomId });

  console.log(currRoom);
  const [contentHTML, setContentHTML] = useState("");
  const [contentCSS, setContentCSS] = useState("");
  const [contentJS, setContentJS] = useState("");

  const router = useRouter();
  const toast = useToast();
  // init room code when its loaded
  useEffect(() => {
    // if current user is owner or in allowed list then redirect to edit
    const userIsAllowedToEdit =
      user &&
      currRoom &&
      (user.id === currRoom.ownerId ||
        currRoom.allowedUsers?.some((u) => u.id === user.id));
    if (userIsAllowedToEdit) router.push(`/ducklets/${roomId}`);
  }, [userLoaded]);
  useEffect(() => {
    // this is so that any new fetch result wont overwrite current content
    if (
      contentCSS === "" &&
      contentHTML === "" &&
      contentJS === "" &&
      currRoom
    ) {
      toast({
        title: "Opened as Guest",
        description: "Any changes made here wont be saved",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      const { contentHTML, contentCSS, contentJS } = currRoom;
      if (contentHTML) setContentHTML(contentHTML);
      if (contentCSS) setContentCSS(contentCSS);
      if (contentJS) setContentJS(contentJS);
    }
  }, [currRoom]);

  if (isLoading)
    return (
      <Center w={"full"} h={"full"}>
        <HStack>
          <Spinner />
          <Box>Loading Ducklet...</Box>
        </HStack>
      </Center>
    );
  return (
    <Box
      width={"100vw"}
      h={"100%"}
      overflow={"hidden"}
      //   bg={"#282A36"}
    >
      {/* <GuestNavbar userLoaded={userLoaded} user={user} room={currRoom} /> */}
      <Split
        style={{ height: "calc(100dvh - 48px)", width: "100%" }}
        direction="vertical"
        minSize={200}
        sizes={[40, 60]}
      >
        <Box>
          <Split
            className="split-h"
            direction="horizontal"
            minSize={0}
            snapOffset={50}
            style={{ width: "100%", height: "100%" }}
          >
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="html" />
              <CMEditor
                value={contentHTML || ""}
                setValue={setContentHTML}
                lang={"html"}
              />
            </Flex>
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="css" />
              <CMEditor
                value={contentCSS || ""}
                setValue={setContentCSS}
                lang={"css"}
              />
            </Flex>
            <Flex direction={"column"} pos={"relative"}>
              <FileBadge fileType="js" />
              <CMEditor
                value={contentJS || ""}
                setValue={setContentJS}
                lang={"js"}
              />
            </Flex>
          </Split>
        </Box>
        <Box w={"full"} bg={"white"}>
          {/* <HStack
            h={"2rem"}
            bg={"#282A36"}
            justifyContent={"space-between"}
            px={"1.5rem"}
          >
            <Box></Box>
            <Box>
              <Tooltip label="This feature is coming soon..." placement="left">
                <Button isDisabled size={"sm"}>Console</Button>
              </Tooltip>
            </Box>
          </HStack> */}
          <IFrameRenderer
            contentHTML={contentHTML}
            contentCSS={contentCSS}
            contentJS={contentJS}
          />
        </Box>
      </Split>
    </Box>
  );
}

export default GuestModeDuckletPage;

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
  let extensions: (LanguageSupport | Extension)[] = [];
  extensions.push(keymap.of([{ key: "Ctrl-Enter", run: expandAbbreviation }]));
  extensions.push(abbreviationTracker());
  extensions.push(indentUnit.of("  "));
  if (lang === "html") {
    extensions.push(html());
  } else if (lang === "css") {
    extensions.push(css());
  } else {
    extensions.push(javascript());
  }
  return (
    <ReactCodeMirror
      value={value}
      onChange={(e) => setValue(e)}
      extensions={extensions}
      theme={dracula}
      key={lang}
    />
  );
};

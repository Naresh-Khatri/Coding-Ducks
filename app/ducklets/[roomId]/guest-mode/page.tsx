"use client";
import React, { use, useEffect, useState } from "react";
import {
  Box,
  Center,
  HStack,
  Spinner,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";

import { useRoomData } from "../../../../hooks/useRoomsData";
import { useParams } from "next/navigation";
import { userContext } from "../../../../contexts/userContext";

import DuckletsNavbar from "components/ducklets/Navbar";
import { DesktopView, MobileView } from "components/ducklets/DuckletViews";

function GuestModeDuckletPage() {
  const { user, userLoaded } = use(userContext);
  const { roomId } = useParams() as { roomId: string };
  const { data: currRoom, isLoading } = useRoomData({ id: +roomId });

  const [contentHEAD, setContentHEAD] = useState("");
  const [contentHTML, setContentHTML] = useState("");
  const [contentCSS, setContentCSS] = useState("");
  const [contentJS, setContentJS] = useState("");
  const [srcDoc, setSrcDoc] = useState("");

  const [layout, setLayout] = useState<"horizontal" | "vertical">("vertical");

  const toast = useToast();
  const [isMobile] = useMediaQuery("(max-width: 650px)");
  // init room code when its loaded
  useEffect(() => {
    if (!currRoom) return;
    const { contentHEAD, contentHTML, contentCSS, contentJS } = currRoom;
    if (contentHEAD) setContentHEAD(contentHEAD);
    if (contentHTML) setContentHTML(contentHTML);
    if (contentCSS) setContentCSS(contentCSS);
    if (contentJS) setContentJS(contentJS);

    let timer: NodeJS.Timeout;
    timer = setTimeout(() => {
      toast({
        title: "Opened as Guest",
        description: "Any changes made here wont be saved",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }, 2000);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currRoom, toast]);

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      setSrcDoc(`
    <html>
      <head>${contentHEAD}</head>
      <body>${contentHTML}</body>
      <style>${contentCSS}</style>
      <script>${contentJS}</script>
    </html>
      `);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [contentHEAD, contentHTML, contentCSS, contentJS]);

  if (isLoading)
    return (
      <Center w={"full"} h={"full"}>
        <HStack>
          <Spinner />
          <Box>Loading Ducklet...</Box>
        </HStack>
      </Center>
    );
  if (!currRoom)
    return (
      <Center w={"full"} h={"full"}>
        <HStack>
          <Box>No Ducklet Found</Box>
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
      <DuckletsNavbar
        user={user}
        userLoaded={userLoaded}
        room={currRoom}
        layout={layout}
        setLayout={setLayout}
      />

      {isMobile ? (
        <MobileView
          srcDoc={srcDoc}
          isGuest={true}
          guestState={{
            head: contentHEAD,
            html: contentHTML,
            css: contentCSS,
            js: contentJS,
            setHead: setContentHEAD,
            setHtml: setContentHTML,
            setCss: setContentCSS,
            setJs: setContentJS,
          }}
        />
      ) : (
        <DesktopView
          layout={layout}
          srcDoc={srcDoc}
          isGuest={true}
          guestState={{
            head: contentHEAD,
            html: contentHTML,
            css: contentCSS,
            js: contentJS,
            setHead: setContentHEAD,
            setHtml: setContentHTML,
            setCss: setContentCSS,
            setJs: setContentJS,
          }}
        />
      )}
    </Box>
  );
}

export default GuestModeDuckletPage;

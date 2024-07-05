"use client";
import React, { use, useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Spinner,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
} from "@chakra-ui/react";

import { useRoomData } from "../../../../hooks/useRoomsData";
import { useParams, useRouter } from "next/navigation";
import { userContext } from "../../../../contexts/userContext";

import DuckletsNavbar from "_components/ducklets/Navbar";
import { DesktopView, MobileView } from "_components/ducklets/DuckletViews";
import Link from "next/link";
import { io } from "socket.io-client";
import {
  USER_JOIN_DUCKLET,
  USER_JOIN_REQUEST_ACCEPTED,
} from "lib/socketio/socketEvents";
import useGlobalStore from "stores";
import EditorSettingsModal from "_components/ducklets/EditorSettingsModal";
import { SettingsIcon } from "@chakra-ui/icons";

function GuestModeDuckletPage() {
  const { user, userLoaded } = use(userContext);
  const socket = useGlobalStore((state) => state.socket);
  const setSocket = useGlobalStore((state) => state.setSocket);

  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const { data, isLoading, error, isError } = useRoomData({ id: +roomId });
  const currRoom = data?.room;
  const role = data?.role;
  if (role === "owner" || role === "contributor")
    router.replace(`/ducklets/${roomId}`);

  const [contentHEAD, setContentHEAD] = useState("");
  const [contentHTML, setContentHTML] = useState("");
  const [contentCSS, setContentCSS] = useState("");
  const [contentJS, setContentJS] = useState("");
  const [srcDoc, setSrcDoc] = useState("");

  const toast = useToast();
  const [isMobile] = useMediaQuery("(max-width: 650px)");
  // init room code when its loaded
  useEffect(() => {
    if (!currRoom) return;
    if (!socket && user) setupSocketIO();
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
  }, [currRoom, toast, user]);
  const setupSocketIO = () => {
    if (!user) return null;
    const _socket = io(
      process.env.NODE_ENV === "development"
        ? "ws://localhost:3333"
        : "wss://api2.codingducks.xyz",
      { query: { userId: user.id } }
    );
    _socket.on(USER_JOIN_REQUEST_ACCEPTED, (payload) => {
      if (typeof window !== "undefined") {
        // router.push(`/ducklets/${roomId}`);
        window.location.href = `/ducklets/${roomId}`;
      }
      toast({
        title: "Request Accepted!",
        description: `Your request has been accepted!`,
        status: "success",
        isClosable: true,
      });
    });
    setSocket(_socket);
  };

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      setSrcDoc(`
    <html>
      <head>${contentHEAD}</head>
      <body>${contentHTML}</body>
      <style>${contentCSS}</style>
      <script>${contentJS}</script>
  <script>const as = document.querySelectorAll('a')
as.forEach(a=>{
  a.href = "javascript:void(0)"
})</script>
    </html>
      `);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [contentHEAD, contentHTML, contentCSS, contentJS]);

  if (isLoading || !role)
    return (
      <Center w={"full"} h={"full"}>
        <HStack>
          <Spinner />
          <Box>Loading Ducklet...</Box>
        </HStack>
      </Center>
    );
  // @ts-ignore
  if (!currRoom || (error && error?.status === 404))
    return (
      <Center w={"100vw"} h={"100vh"}>
        <VStack>
          <Text>Ducklet Not Found</Text>
          <Link href="/ducklets">
            <Button>Go Home</Button>
          </Link>
        </VStack>
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
        room={currRoom}
        roomRole={role}
        guestMode={true}
        htmlHead={contentHEAD}
        setHtmlHead={setContentHEAD}
      />

      {isMobile ? (
        // @ts-ignore
        <MobileView
          srcDoc={srcDoc}
          guestMode={true}
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
        // @ts-ignore
        <DesktopView
          srcDoc={srcDoc}
          guestMode={true}
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

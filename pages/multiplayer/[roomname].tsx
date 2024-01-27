import { io } from "socket.io-client";
import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "../../lib/axios";
import { useQuery } from "@tanstack/react-query";
import FAIcon from "../../components/FAIcon";
import dynamic from "next/dynamic";

import ConnectedUsers from "../../components/multiplayer/ConnectedUsers";
import LanguageSelector from "../../components/multiplayer/LanguageSelector";

import {
  faLeftLong,
  faMessage,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { userContext } from "../../contexts/userContext";
import { websocketContext } from "../../contexts/websocketContext";
import {
  Badge,
  Box,
  Button,
  Container,
  Fade,
  Grid,
  GridItem,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import SetMeta from "../../components/SEO/SetMeta";
import NormalLayout from "../../layout/NormalLayout";
import {
  CODE_EXEC_START,
  CODE_UPDATE,
  CURSOR_UPDATE,
  LANG_UPDATE,
  USER_JOIN,
  USER_LEAVE,
} from "../../lib/socketio/socketEvents";
import { UserJoin, UserLeave } from "../../lib/socketio/socketEventTypes";
import ChatMessages from "../../components/ChatMessage";
import Link from "next/link";

const CustomAce = dynamic(() => import("../../components/CustomAce"), {
  ssr: false,
});

function RoomPage() {
  const { user } = useContext(userContext);
  const {
    currRoomInfo,
    consoleInfo,
    setConsoleInfo,
    cursors,
    msgsList,
    resultIsLoading,
    socket,
    currRoomClients,
    resetStates,
  } = useContext(websocketContext);
  // const roomname =
  const router = useRouter();
  const [code, setCode] = useState("");

  const [showChat, setShowChat] = useState(false);
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(msgsList.length);

  // JOIN ROOM
  useEffect(() => {
    const { roomname } = router.query;
    if (roomname && Object.keys(user).length > 0 && socket) {
      socket.emit(USER_JOIN, {
        room: { name: roomname },
        user: { id: user.id, username: user.username },
      } as UserJoin);
    }
    return () => {
      // HACK: should pass room.id only in payload but its null, so using name instead
      if (socket)
        socket.emit(USER_LEAVE, {
          room: { name: roomname },
          user: { id: user.id, username: user.username },
        } as UserLeave);
      // resetStates();
    };
  }, [router.isReady, user.id, socket]);

  const handleOnCodeChange = (code: string) => {
    setCode(code);
    const userr = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
    };
    const roomInfoo = {
      id: currRoomInfo.id,
      name: currRoomInfo.name,
    };
    socket.emit(CODE_UPDATE, { code, userr, roomInfo: roomInfoo });
  };

  const handleOnCursorChange = (cursor) => {
    // console.log(cursor);
    socket.emit(CURSOR_UPDATE, {
      cursor,
      user: { id: user.id, username: user.username, fullname: user.fullname },
      roomInfo: {
        id: currRoomInfo.id,
        name: currRoomInfo.name,
      },
    });
  };

  const handleLangChange = (e) => {
    const lang = e.target.value;
    socket.emit(LANG_UPDATE, {
      lang,
      roomInfo: { name: currRoomInfo.name, id: currRoomInfo.id },
      user: { id: user.id, username: user.username },
    });
  };

  const handleRunCode = () => {
    socket.emit(CODE_EXEC_START, {
      lang: currRoomInfo.lang,
      code,
      roomInfo: { name: currRoomInfo.name, id: currRoomInfo.id },
      user: { id: user.id, username: user.username },
    });
  };

  const handleLeaveRoom = () => {
    socket.emit(USER_LEAVE, {
      roomInfo: { name: currRoomInfo.name, id: currRoomInfo.id },
      user: { id: user.id, username: user.username },
    });
    router.push("/multiplayer");
    // setRoom(null);
    // setConsoleInfo(null);
  };

  if (socket && !socket.connected) {
    return <Text> connecting to web socket</Text>;
  }
  if (currRoomInfo === null) {
    return <Text> joining room</Text>;
  }
  return (
    <NormalLayout>
      <SetMeta
        title="Coding Ducks - Collaborative Real-Time Coding with Friends"
        description="Code collaboratively in real-time with your friends on Coding Ducks. Engage in multiplayer coding challenges, work together on problem-solving, and strengthen your coding skills as a team."
        keywords="multiplayer coding challenges, collaborative coding, real-time coding, coding with friends, teamwork, problem-solving, programming collaboration"
        url="https://codingducks.live/multiplayer"
      />
      <Container maxW={{ base: "100vw", md: "90vw" }} minH={"100vh"}>
        <HStack justifyContent={"space-between"}>
          {showChat ? (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(false)}
              leftIcon={<FAIcon icon={faLeftLong} />}
            >
              Hide Chat
            </Button>
          ) : (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(true)}
              leftIcon={<FAIcon icon={faMessage} />}
              pos={"relative"}
              rightIcon={
                <Badge
                  bg={"red"}
                  borderRadius={"50%"}
                  w={"fit-content"}
                  h={"auto"}
                  fontSize={"lg"}
                  position={"absolute"}
                  top={"-.5rem"}
                  right={"-.5rem"}
                >
                  <Fade in={true}>{msgsList.length}</Fade>
                </Badge>
              }
            >
              Show Chat
            </Button>
          )}
          <Link href={"/multiplayer"}>
            <Button colorScheme="red">Leave Room</Button>
          </Link>
        </HStack>
        <Grid templateColumns="repeat(4, 1fr)">
          {showChat && (
            <GridItem colSpan={1}>
              <ChatMessages
                socket={socket}
                roomInfo={currRoomInfo}
                user={user}
                msgsList={msgsList}
              />
            </GridItem>
          )}
          <GridItem colSpan={showChat ? 3 : 4} height={"100%"}>
            <HStack my={2} justify={"space-between"}>
              <LanguageSelector
                roomInfo={currRoomInfo}
                handleLangChange={handleLangChange}
              />
              <Box>
                <Button
                  colorScheme="green"
                  rightIcon={<FAIcon icon={faPlay} />}
                  onClick={handleRunCode}
                  isLoading={resultIsLoading}
                >
                  Run
                </Button>
              </Box>
              {currRoomInfo?.clients && (
                <ConnectedUsers clients={currRoomClients} currentUser={user} />
              )}
            </HStack>
            {/* {JSON.stringify(currRoomInfo, null , 2)} */}
            <CustomAce
              value={code}
              onChange={handleOnCodeChange}
              handleOnCursorChange={handleOnCursorChange}
              cursors={cursors}
              fontSize={20}
            />

            {consoleInfo && (
              <>
                <Text mt={2} fontSize={"xl"}>
                  Console:
                </Text>
                <Box
                  bg="black"
                  color="white"
                  p={2}
                  borderRadius={5}
                  mt={2}
                  overflowY={"auto"}
                  maxHeight={"50vh"}
                  fontSize={"lg"}
                  dangerouslySetInnerHTML={{
                    __html:
                      consoleInfo?.stderr?.replace(/\n/g, "<br />") ||
                      consoleInfo?.stdout?.replace(/\n/g, "<br />") ||
                      consoleInfo?.code,
                  }}
                ></Box>
              </>
            )}
          </GridItem>
        </Grid>
      </Container>
    </NormalLayout>
  );
}

export default RoomPage;

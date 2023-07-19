import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  HStack,
  Input,
  Select,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

import NormalLayout from "../layout/NormalLayout";
import {
  faLeftLong,
  faMessage,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { userContext } from "../contexts/userContext";
import { AddIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import ChatMessage from "../components/ChatMessage";
import dynamic from "next/dynamic";
import ConnectedUsers from "../components/multiplayer/ConnectedUsers";
import LanguageSelector from "../components/multiplayer/LanguageSelector";
import { IChatMessage, ICursor, IDefaultResult, IRoom } from "../types";
import SetMeta from "../components/SEO/SetMeta";
import FAIcon from "../components/FAIcon";

const CustomAce = dynamic(() => import("../components/CustomAce"), {
  ssr: false,
});
function MultiplayerPage() {
  const { user } = useContext(userContext);
  const { data: roomsData, isLoading: roomsLoading } = useQuery(["rooms"], () =>
    axiosInstance("/playground/rooms")
  );

  const [showChat, setShowChat] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [room, setRoom] = useState<IRoom>(null);
  const [code, setCode] = useState("");
  const [roomname, setRoomname] = useState("");

  const [msgsList, setMsgsList] = useState<IChatMessage[]>([]);
  const [cursors, setCursors] = useState<Map<string, ICursor>>(new Map());

  const [consoleInfo, setConsoleInfo] = useState<IDefaultResult>(null);
  const [resultIsLoading, setResultIsLoading] = useState(false);

  const toast = useToast();
  const router = useRouter();

  // check params for room name
  useEffect(() => {
    if (router.query.roomname && Object.keys(user).length > 0 && socket) {
      joinRoom(router.query.roomname as string);
    }
  }, [router.isReady, user.id, socket]);

  //setup socketio connection
  useEffect(() => {
    if (Object.keys(user).length === 0) return;

    // const socketInstance = io("ws://localhost:3333");
    const socketInstance = io("wss://api.codingducks.live");
    setSocket(socketInstance);

    socketInstance.on("connect success", (user) => {
      console.log("naiceeeee", user);
    });
    socketInstance.on("user-joined", (payload) => {
      const { user, clients } = payload;
      console.log("user-connected", payload);
      setRoom((p) => {
        return { ...p, clients: clients };
      });
      toast({
        title: "User connected",
        description: `${user.username} has joined the room`,
        status: "success",
        isClosable: true,
      });
    });
    socketInstance.on("user-disconnected", (payload) => {
      const { user, clients } = payload;
      toast({
        title: "User disconnected",
        description: `${user.username} has left the room`,
        status: "error",
        isClosable: true,
      });
      setRoom((p) => {
        return { ...p, clients: clients };
      });
    });
    socketInstance.on("create-room-update", (res) => {
      if (res.status === "success") setRoom(res);
      else setRoom(null);
      console.log(res);
      setIsCreatingRoom(false);
      console.log(socket);
      toast({
        title: "Created Room Successfully",
        description: "You can now share the room link with your friends",
        status: "success",
        isClosable: true,
      });
    });
    socketInstance.on("join-room-success", (res) => {
      console.log(res);
      if (res.status === "success") {
        setRoom(res);
        setCode(res.roomInfo.content);
        setMsgsList(res.msgsList);
        // set cursors
        const cursors = new Map();
        if (Object.keys(res.cursors).length > 0)
          Object.keys(res.cursors).forEach((userIds) => {
            cursors.set(userIds, res.cursors[userIds]);
          });
      } else setRoom(null);
      console.log(res);
      setIsCreatingRoom(false);
      toast({
        title: "Joined Room Successfully",
        description: "You can now share the room link with your friends",
        status: "success",
        isClosable: true,
      });
    });
    socketInstance.on("message", (newMsg) => {
      console.log(newMsg);
      setMsgsList((p) => [newMsg, ...p]);
    });
    socketInstance.on("room-update", (payload) => {
      console.log("room-update", payload);
      setRoom((p) => {
        return { ...p, payload };
      });
      console.log(room);
    });
    socketInstance.on("code-change", (payload) => {
      const { code } = payload;
      setCode(code);
    });
    socketInstance.on("disconnect", () => {
      if (room) socketInstance.emit("user-disconnected", room.roomInfo, user);
    });
    socketInstance.on("change-user-cursor", (payload) => {
      const { cursor: newCursors, user, roomInfo } = payload;
      setCursors((p) => {
        if (p.has(user.id)) {
          const cursor = p.get(user.id);
          cursor.row = newCursors.row;
          cursor.col = newCursors.col;
          cursor.username = user.username;
          p.set(user.id, cursor);
        } else {
          p.set(user.id, newCursors);
        }
        return new Map(p);
      });
    });
    socketInstance.on("change-lang", (payload) => {
      console.log("changed lang:", payload);
      const { lang } = payload;
      setRoom((p) => {
        return { ...p, roomInfo: { ...p.roomInfo, lang } };
      });
      toast({
        title: "Language Changed!",
        description: `${payload.user.username} changed to ${lang}`,
        status: "success",
        isClosable: true,
      });
    });
    socketInstance.on("code-exec-started", (payload) => {
      toast({
        title: "Execution Requested!",
        description: `${payload.user.username} has ran the code`,
        status: "success",
        isClosable: true,
      });
      setResultIsLoading(true);
      setTimeout(() => {
        setResultIsLoading(false);
      }, 4000);
    });
    socketInstance.on("code-exec-finished", (payload) => {
      setConsoleInfo(payload.res);
      setResultIsLoading(false);
    });
  }, [user]);

  const createRoom = () => {
    if (!user.id) return;
    setIsCreatingRoom(true);
    const initRoom = {
      roomname: roomname,
      user: {
        id: user.id,
        username: user.username,
      },
    };
    socket.emit("create-room", initRoom);
  };

  const joinRoom = (name?: string) => {
    if (Object.keys(user).length === 0 || !socket) return;
    console.log("join request", name, user);
    router.push({
      pathname: "/multiplayer",
      query: { roomname: name || roomname },
    });
    const payload = {
      roomname: name || roomname,
      user: {
        id: user.id,
        username: user.username,
      },
    };
    socket.emit("join-room", payload);
  };

  const handleOnCodeChange = (code: string) => {
    setCode(code);
    const userr = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
    };
    const roomInfoo = {
      id: room.roomInfo.id,
      name: room.roomInfo.name,
    };
    socket.emit("code-change", { code, userr, roomInfo: roomInfoo });
  };

  const handleOnCursorChange = (cursor) => {
    // console.log(cursor);
    socket.emit("change-user-cursor", {
      cursor,
      user: { id: user.id, username: user.username, fullname: user.fullname },
      roomInfo: {
        id: room.roomInfo.id,
        name: room.roomInfo.name,
      },
    });
  };

  const handleLangChange = (e) => {
    const lang = e.target.value;
    socket.emit("change-lang", {
      lang,
      roomInfo: { name: room.roomInfo.name, id: room.roomInfo.id },
      user: { id: user.id, username: user.username },
    });
  };

  const handleRunCode = () => {
    socket.emit("code-exec", {
      lang: room.roomInfo.lang,
      code,
      roomInfo: { name: room.roomInfo.name, id: room.roomInfo.id },
      user: { id: user.id, username: user.username },
    });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", {
      roomInfo: { name: room.roomInfo.name, id: room.roomInfo.id },
      user: { id: user.id, username: user.username },
    });
    router.push("/multiplayer");
    setRoom(null);
    setConsoleInfo(null);
  };

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
          {room && showChat && (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(false)}
              leftIcon={<FAIcon icon={faLeftLong} />}
            >
              Hide Chat
            </Button>
          )}
          {room && !showChat && (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(true)}
              rightIcon={<FAIcon icon={faMessage} />}
            >
              Show Chat
            </Button>
          )}
          {room && (
            <Button colorScheme="red" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          )}
        </HStack>
        {!room ? (
          <>
            <HStack justifyContent={"center"} alignItems={"center"} mt={20}>
              <Input
                value={roomname}
                placeholder="Enter room name"
                w={"50%"}
                onChange={(e) => setRoomname(e.target.value)}
              />
              <HStack>
                <Button
                  colorScheme="green"
                  isLoading={isCreatingRoom}
                  p={"1rem 2rem"}
                  leftIcon={<AddIcon />}
                  onClick={createRoom}
                >
                  Create
                </Button>
                <Button
                  colorScheme="blue"
                  p={"1rem 2rem"}
                  onClick={() => joinRoom()}
                >
                  Join
                </Button>
              </HStack>
            </HStack>
            {roomsLoading ? (
              <Text>Loading...</Text>
            ) : (
              <VStack mt={10}>
                <Text>available rooms:</Text>
                {roomsData.data.map((room, i) => (
                  <Button key={i} onClick={() => joinRoom(room.name)}>
                    {room.name} #{room.id}
                  </Button>
                ))}
              </VStack>
            )}
          </>
        ) : (
          <Grid templateColumns="repeat(4, 1fr)">
            {showChat && (
              <GridItem colSpan={1}>
                <ChatMessage
                  socket={socket}
                  roomInfo={room.roomInfo}
                  user={user}
                  msgsList={msgsList}
                />
              </GridItem>
            )}
            <GridItem colSpan={showChat ? 3 : 4} height={"100%"}>
              <HStack my={2} justify={"space-between"}>
                <LanguageSelector
                  roomInfo={room?.roomInfo}
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
                <ConnectedUsers clients={room.clients} currentUser={user} />
              </HStack>
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
        )}
      </Container>
    </NormalLayout>
  );
}

export default MultiplayerPage;

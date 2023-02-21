import { useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Avatar,
  AvatarBadge,
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLeftLong,
  faMessage,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { userContext } from "../contexts/userContext";
import { AddIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axios";
import { User } from "../hooks/useSubmissionsData";
import ChatMessage from "../components/ChatMessage";
import dynamic from "next/dynamic";
import { Cursor } from "../components/CustomAce";

interface message {
  userId: number;
  username: string;
  text: string;
  time?: string;
  roomId: string;
  photoURL: string;
}
interface Room {
  clients: User[];
  cursors: Cursor[];
  msgsList: message[];
  roomInfo: {
    id: string;
    isPublic: boolean;
    name: string;
    lang: string;
    owner: User;
    ownerId: number;
  };
}
interface Result {
  stdout: string;
  stderr: string;
  code?: string;
  exitCode: number;
  memoryUsage: number;
  cpuUsage: number;
  signal: string;
  errorType?: "compile-time" | "run-time" | "pre-compile-time" | "run-timeout";
}

const CustomAce = dynamic(() => import("../components/CustomAce"), {
  ssr: false,
});
function TestPage() {
  const { user } = useContext(userContext);
  const { data: roomsData, isLoading: roomsLoading } = useQuery(["rooms"], () =>
    axiosInstance("/playground/rooms")
  );

  const [showChat, setShowChat] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [room, setRoom] = useState<Room>(null);
  const [code, setCode] = useState(`function getRandomInt(max) {
   return Math.floor(Math.random() * max);
}
  
console.log(getRandomInt(3));
// Expected output: 0, 1 or 2
  
console.log(getRandomInt(1));
// Expected output: 0
  
console.log(Math.random());
// Expected output: a number from 0 to <1
`);
  const [roomname, setRoomname] = useState("room1");

  const [msgsList, setMsgsList] = useState<message[]>([]);
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());

  const [consoleInfo, setConsoleInfo] = useState<Result>(null);
  const [resultIsLoading, setResultIsLoading] = useState(false);
  // for select option bg
  const color = useColorModeValue("black", "white");

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

    // console.log(Object.keys(user).length > 0);
    const socketInstance = io("ws://localhost:3333");
    setSocket(socketInstance);

    socketInstance.on("connect success", (user) => {
      console.log("naiceeeee", user);
    });
    socketInstance.on("user-disconnected", (user) => {
      console.log("user-disconnected", user);
      toast({
        title: "User disconnected",
        description: `${user.username} has left the room`,
        status: "error",
        isClosable: true,
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
    socketInstance.on("update-clients", (payload) => {
      console.log(payload);
      setRoom((p) => {
        return { ...p, clients: payload.clients };
      });
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
    socket.emit("code-change", { code, user, roomInfo: room.roomInfo });
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
      <Container maxW={{ base: "100vw", md: "100vw" }} minH={"100vh"}>
          {room && showChat && (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(false)}
              leftIcon={<FontAwesomeIcon icon={faLeftLong as IconProp} />}
            >
              Hide Chat
            </Button>
          )}
          {room && !showChat && (
            <Button
              colorScheme="blue"
              onClick={() => setShowChat(true)}
              rightIcon={<FontAwesomeIcon icon={faMessage as IconProp} />}
            >
              Show Chat
            </Button>
          )}
          {room && (
            <Button colorScheme="red" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          )}
        {!room ? (
          <>
            <HStack justifyContent={"center"} alignItems={"center"} mt={20}>
              <Input
                value={roomname}
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
            <GridItem colSpan={3} height={"100%"}>
              <HStack m={2} justify={"space-between"}>
                <Select
                  bg="purple.500"
                  color="white"
                  maxW={40}
                  value={room?.roomInfo?.lang || "py"}
                  onChange={handleLangChange}
                  fontWeight="extrabold"
                >
                  <option style={{ color: color }} value="py">
                    Python
                  </option>
                  <option style={{ color }} value="js">
                    Javascript
                  </option>
                  <option style={{ color }} value="cpp">
                    C++
                  </option>
                  <option style={{ color }} value="c">
                    C
                  </option>
                  <option style={{ color }} value="java">
                    Java
                  </option>
                </Select>
                <Box>
                  <Button
                    colorScheme="green"
                    rightIcon={<FontAwesomeIcon icon={faPlay as IconProp} />}
                    onClick={handleRunCode}
                    isLoading={resultIsLoading}
                  >
                    Run
                  </Button>
                </Box>
                <HStack>
                  {Object.keys(room.clients).map((socketId, i) => (
                    <HStack key={socketId}>
                      <Avatar
                        key={i}
                        name={room.clients[socketId].username}
                        src={room.clients[socketId].photoURL}
                        size="sm"
                        colorScheme="green"
                      >
                        <AvatarBadge boxSize="1.25em" bg={"green.500"} />
                      </Avatar>
                    </HStack>
                  ))}
                </HStack>
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

export default TestPage;

import React, { useContext, useEffect, useState } from "react";
import FAIcon from "../../components/FAIcon";

import ConnectedUsers from "../../components/multiplayer/ConnectedUsers";

import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { userContext } from "../../contexts/userContext";
import { websocketContext } from "../../contexts/websocketContext";
import {
  Box,
  Button,
  Center,
  Collapse,
  Flex,
  HStack,
  ListItem,
  Text,
  UnorderedList,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import SetMeta from "../../components/SEO/SetMeta";
import NormalLayout from "../../layout/NormalLayout";
import {
  CODE_EXEC_START,
  IYJsUser,
  ROOM_GET,
} from "../../lib/socketio/socketEvents";
import ChatMessages from "../../components/ChatMessage";
import Link from "next/link";
import Split from "react-split";
import SideBar from "../../components/multiplayer/SideBar";
import useGlobalStore from "../../stores";
import { javascript } from "@codemirror/lang-javascript";
import { vim } from "@replit/codemirror-vim";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import CodeMirror from "@uiw/react-codemirror";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { useFileData } from "../../hooks/useFileSystemData";
import MultiplayerWeb from "../../components/multiplayer/web/MultiplayerWeb";

function RoomPage() {
  const { user } = useContext(userContext);
  const { consoleInfo, setConsoleInfo, msgsList, resultIsLoading, socket } =
    useContext(websocketContext);
  const {
    isOpen: isSidebarOpen,
    onOpen: onSidebarOpen,
    onClose: onsidebarClose,
    onToggle: onSidebarToggle,
  } = useDisclosure();
  const currRoom = useGlobalStore((state) => state.currRoom);
  const setCurrRoom = useGlobalStore((state) => state.setCurrRoom);
  const currFileId = useGlobalStore((state) => state.currFileId);
  const initFs = useGlobalStore((state) => state.initFS);

  const ydocument = useGlobalStore((status) => status.yDoc);

  const [provider, setProvider] = useState<SocketIOProvider>();
  const [status, setStatus] = useState("");
  const clients = useGlobalStore((state) => state.clients);
  const setClients = useGlobalStore((state) => state.setClients);
  const openFilesByClients = useGlobalStore(
    (state) => state.openFilesByClients
  );

  const setOpenFilesByClients = useGlobalStore(
    (state) => state.setOpenFilesByClients
  );

  const router = useRouter();

  const [unreadMsgsCount, setUnreadMsgsCount] = useState(msgsList.length);

  const {
    data: fileData,
    isLoading: fileDataLoading,
    error: fileDataLoadingError,
    refetch: refetchFileData,
  } = useFileData(currFileId);
  useEffect(() => {
    if (!router.isReady || !socket) return;

    socket.emit(ROOM_GET, { roomName: router.query.roomname }, (res) => {
      const { error, message, data } = res;
      if (error) {
        setStatus(message || "An error occurred");
        return;
      }
      const { room, fs, msgsList } = data;
      setCurrRoom(room);
      initFs(fs);
      setUnreadMsgsCount(msgsList.length);

      // Initialize provider
      const socketIOProvider = new SocketIOProvider(
        // "wss://dev3333.codingducks.live",
        "ws://localhost:3333",
        `room-${room.name}`,
        ydocument,
        {
          autoConnect: false,
          disableBc: true,
        }
      );
      // Set awareness user
      socketIOProvider.awareness.setLocalState({
        name: user.username,
        photoURL: user.photoURL,
        username: user.username,
        id: user.id,
        openedFileId: currFileId,
        // color: userColor.color,
        // colorLight: userColor.light,
      });
      socketIOProvider.awareness.on("update", (e) => {
        // const updatedClientId = e.added[0] || e.updated[0];
        // console.log("change: ", e);
        // console.log(changed)
        const _clients = Array.from(socketIOProvider.awareness.getStates()).map(
          (c: [number, IYJsUser]) => ({
            ...c[1],
            clientId: c[0],
          })
        );
        // console.log(_clients)
        const openFilesByClients = Object.groupBy(
          _clients,
          (item) => item.openedFileId
        );
        setOpenFilesByClients(openFilesByClients);
        setClients(_clients);
        setUnreadMsgsCount(msgsList.length);
        // get the user who changed the file and show a toast
        // const updatedUser = _clients.find(
        //   (c) => c.clientId === updatedClientId
        // );
        // console.log(_clients.map(c=>c.))
        setClients(_clients);
      });
      setProvider(socketIOProvider);
    });
    return () => {
      if (provider) provider.destroy();
      if (ydocument) ydocument.destroy();
    };
  }, [socket, router.isReady, user.id]);
  useEffect(() => {
    if (!provider) return;

    provider.awareness.setLocalStateField("openedFileId", currFileId);
    // console.log(ydocument.getText(`room-${currRoom.id}:file-${currFileId}`));
    // refetchFileData();
  }, [currFileId, provider]);

  // JOIN ROOM
  // useEffect(() => {
  //   const { roomname } = router.query;
  //   if (roomname && Object.keys(user).length > 0 && socket) {
  //     socket.emit(USER_JOIN, {
  //       room: { name: roomname },
  //       user: { id: user.id, username: user.username },
  //     } as UserJoin);
  //   }
  //   return () => {
  //     // HACK: should pass room.id only in payload but its null, so using name instead
  //     // if (socket)
  //     //   socket.emit(USER_LEAVE, {
  //     //     room: { name: roomname },
  //     //     user: { id: user.id, username: user.username },
  //     //   } as UserLeave);
  //     // resetStates();
  //   };
  // }, [router.isReady, socket]);

  // const handleOnCodeChange = (event: ICodeChangeEvent) => {
  //   const userr: ISocketUser = {
  //     id: user.id,
  //     username: user.username,
  //     fullname: user.fullname,
  //   };
  //   const roomInfoo = {
  //     id: currRoom.id,
  //     name: currRoom.name,
  //   };
  //   socket.emit(CODE_UPDATE, {
  //     user: userr,
  //     room: roomInfoo,
  //     event,
  //   } as CodeUpdate);
  // };

  // // this is only responsible for cursor change and not code change
  // const handleOnCursorChange = (cursor: ICursorPos) => {
  //   const payload: CursorUpdate = {
  //     user: { id: user.id, username: user.username },
  //     room: { id: currRoom.id, name: currRoom.name },
  //     newPos: cursor,
  //   };
  //   socket.emit(CURSOR_UPDATE, payload);
  // };
  // const handleOnSelectionChange = (event: {
  //   type: "insert" | "remove";
  //   anchor: ICursorPos;
  //   lead: ICursorPos;
  // }) => {
  //   console.log(event);
  // };

  // const handleLangChange = (e) => {
  //   const lang = e.target.value;
  //   socket.emit(LANG_UPDATE, {
  //     lang,
  //     roomInfo: { name: currRoom.name, id: currRoom.id },
  //     user: { id: user.id, username: user.username },
  //   });
  // };
  // const handleLeaveRoom = () => {
  //     socket.emit(USER_LEAVE, {
  //       roomInfo: { name: currRoom.name, id: currRoom.id },
  //       user: { id: user.id, username: user.username },
  //     });
  //     router.push("/multiplayer");
  //     // setRoom(null);
  //     // setConsoleInfo(null);
  //   };

  // const handleRunCode = () => {
  //   socket.emit(CODE_EXEC_START, {
  //     lang: currRoom.lang,
  //     code,
  //     roomInfo: { name: currRoom.name, id: currRoom.id },
  //     user: { id: user.id, username: user.username },
  //   });
  // };

  if (socket && !socket.connected) {
    return <Text> connecting to web socket</Text>;
  }
  if (!user.id) {
    return <Text> pls login</Text>;
  }
  if (currRoom === null) {
    return <Text> joining room</Text>;
  }
  // WEB ROOM
  if (currRoom.type === "web") return <MultiplayerWeb room={currRoom} />;
  // NORMAL ROOM
  else if (currRoom.type === "normal")
    return (
      <>
        <SetMeta
          title="Coding Ducks - Collaborative Real-Time Coding with Friends"
          description="Code collaboratively in real-time with your friends on Coding Ducks. Engage in multiplayer coding challenges, work together on problem-solving, and strengthen your coding skills as a team."
          keywords="multiplayer coding challenges, collaborative coding, real-time coding, coding with friends, teamwork, problem-solving, programming collaboration"
          url="https://codingducks.live/multiplayer"
        />
        <Box w={"full"} h={"100dvh"}>
          {/* {showChat && (
            <GridItem colSpan={1}>
              <ChatMessages
                socket={socket}
                roomInfo={currRoom}
                user={user}
                msgsList={msgsList}
              />
            </GridItem>
          )} */}
          <Button onClick={onSidebarToggle}>toogle</Button>
          <Split
            className="split-h"
            minSize={isSidebarOpen ? 0 : 200}
            sizes={isSidebarOpen ? [0, 100] : [20, 80]}
            style={{ height: "100%", width: "100%" }}
          >
            <Box>
              <SideBar />
            </Box>
            <Flex h={"100dvh"} direction={"column"}>
              <HStack my={2} justify={"space-between"}>
                <Link href={"/multiplayer"}>
                  {/* <Button colorScheme="red">Leave Room</Button> */}
                </Link>
                {/* <LanguageSelector
                roomInfo={currRoom}
                handleLangChange={handleLangChange}
              /> */}
                <Box></Box>
                <Box>
                  <Button
                    colorScheme="green"
                    rightIcon={<FAIcon icon={faPlay} />}
                    // onClick={handleRunCode}
                    isLoading={resultIsLoading}
                  >
                    Run
                  </Button>
                </Box>
                <ConnectedUsers clients={clients} currentUser={user} />
              </HStack>
              {/* <AceEditorWithCursors
              value={code}
              handleOnCodeChange={handleOnCodeChange}
              handleOnCursorChange={handleOnCursorChange}
              handleOnSelectionChange={handleOnSelectionChange}
              fontSize={20}
            /> */}

              {/* <MonacoEditorWithCursors
              height={"900px"}
              theme="vs-dark"
              room={currRoom}
            /> */}
              {provider &&
                Object.values(openFilesByClients).map((clients, i) => (
                  <Box key={i}>
                    {clients.map((client) => (
                      <>
                        {client.openedFileId !== 0 && (
                          <Text as="pre" key={client.clientId}>
                            {client.username} is editing fileID:{" "}
                            {client.openedFileId}
                          </Text>
                        )}
                      </>
                    ))}
                  </Box>
                ))}
              {currFileId === 0 ? (
                <Center h={"full"}>
                  <HStack color={"whiteAlpha.500"}>
                    <ChevronLeftIcon fontSize={"6xl"} pt={"1rem"} />
                    <Text as="pre" fontSize={"4xl"}>
                      open a file
                    </Text>
                  </HStack>
                </Center>
              ) : (
                <Box position={"relative"}>
                  {openFilesByClients[currFileId] &&
                    openFilesByClients[currFileId].length > 1 && (
                      <ClientsOnFile clients={openFilesByClients[currFileId]} />
                    )}
                  {!fileDataLoading && (
                    <>
                      {/* <Text as={"pre"}>{JSON.stringify(fileData)}</Text> */}
                      <CodeMirror
                        key={currFileId + fileData.id || 0}
                        value={
                          ydocument
                            .getText(`room-${currRoom.id}:file-${currFileId}`)
                            .toJSON() || fileData.code
                        }
                        extensions={[
                          javascript(),
                          vim(),
                          yCollab(
                            ydocument.getText(
                              `room-${currRoom.id}:file-${currFileId}`
                            ),
                            provider.awareness
                          ),
                        ]}
                        style={{ height: "100%" }}
                        theme={"dark"}
                      />
                    </>
                  )}
                </Box>
              )}

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
            </Flex>
          </Split>
        </Box>
      </>
    );
  else return <h1> Room not supported</h1>;
}

export default RoomPage;

const ClientsOnFile = ({ clients }: { clients: IYJsUser[] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // if (clients.length === 0) return null;
  return (
    <Box
      position={"absolute"}
      top={".5"}
      right={".5rem"}
      zIndex={1}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      cursor={"default"}
    >
      <HStack bg={"blackAlpha.600"} borderRadius={"5px"} px={2} py={1}>
        <Box
          borderRadius={"50%"}
          w={".5rem"}
          h={".5rem"}
          bg={"green.400"}
        ></Box>
        <Text>2 users here</Text>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack
          bg={"blackAlpha.600"}
          borderRadius={"5px"}
          px={2}
          py={1}
          cursor={"auto"}
        >
          <UnorderedList p={0}>
            {clients.map((client) => (
              <ListItem key={client.id}>
                <Text> {client.username}</Text>
              </ListItem>
            ))}
          </UnorderedList>
        </VStack>
      </Collapse>
    </Box>
  );
};

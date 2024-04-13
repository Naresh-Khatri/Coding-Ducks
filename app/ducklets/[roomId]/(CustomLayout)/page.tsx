"use client";
import { use, useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

import {
  ISocketRoom,
  ISocketUser,
  IYJsUser,
  ROOM_UPDATED,
  USER_JOIN_DUCKLET,
  USER_JOIN_REQUEST,
  USER_JOIN_REQUESTED,
  USER_JOIN_REQUEST_ACCEPT,
  USER_JOIN_REQUEST_ACCEPTED,
  USER_REMOVED_FROM_DUCKLET,
} from "lib/socketio/socketEvents";
import {
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { debounce, getRandColor } from "lib/utils";
import useGlobalStore from "stores";
import { io } from "socket.io-client";
import {
  useMutateRoom,
  useMutateRoomContents,
  useRoomData,
  useUpdateAllowList,
} from "hooks/useRoomsData";
import { useParams, useRouter } from "next/navigation";
import { userContext } from "contexts/userContext";

import * as Y from "yjs";
import {
  RoomUpdate,
  RoomUpdated,
  UserJoinDucklet,
  UserJoinRequest,
} from "lib/socketio/socketEventTypes";
import DucksletsList from "components/ducklets/DucksletsList";
import DuckletsNavbar from "components/ducklets/Navbar";
import UserAvatar from "components/utils/UserAvatar";
import Link from "next/link";
import SetMeta from "components/SEO/SetMeta";
import { DesktopView, MobileView } from "components/ducklets/DuckletViews";

const yDoc = new Y.Doc();

function DuckletPage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const toast = useToast();
  const {
    data,
    isLoading,
    error: errorRoomData,
    isError: isErrorRoomData,
    refetch: refetchCurrRoom,
  } = useRoomData({ id: +roomId });
  const currRoom = data?.room;
  const role = data?.role;
  if (role === "guest") {
    // i know i know this seems to be a bad idea
    if (typeof window !== "undefined")
      window.location.href = `/ducklets/${roomId}/guest-mode`;
    else router.push(`/ducklets/${roomId}/guest-mode`);
  }
  const [srcDoc, setSrcDoc] = useState("");
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [layout, setLayout] = useState<"horizontal" | "vertical">("vertical");

  const { mutate: mutateRoomContents } = useMutateRoomContents(+roomId);
  const { mutate: mutateRoom, isLoading: roomMutationLoading } = useMutateRoom(
    currRoom?.id || 0
  );

  const socket = useGlobalStore((state) => state.socket);
  const setSocket = useGlobalStore((state) => state.setSocket);

  const [clients, setClients] = useState<IYJsUser[]>([]);

  const [waitingForJoinRequest, setWatingForJoinRequest] = useState(false);

  const [isMobile] = useMediaQuery("(max-width: 650px)");

  const {
    isOpen: isAllowRequestModalOpen,
    onOpen: onAllowRequestModalOpen,
    onClose: onAllowRequestModalClose,
  } = useDisclosure();
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const [requestingUser, setRequestingUser] = useState<ISocketUser | null>(
    null
  );

  const { mutate: mutateAllowList } = useUpdateAllowList();

  const { user, userLoaded } = use(userContext);

  useEffect(() => {
    if (isLoading || !userLoaded) return;
    // @ts-ignore
    if (isErrorRoomData && errorRoomData && errorRoomData.data.code === 404) {
      console.error("room not found");
      return;
    }
    if (!socket) {
      setupSocketIO();
    }
    return () => {
      // todo: cleanup mousemove listener
      if (currRoom && currRoom.id === +roomId) return;
      if (provider) {
        provider.awareness.setLocalState(null);
        provider.destroy();
      }
      if (yDoc) {
        console.log("desty doc");
        yDoc.destroy();
      }
    };
  }, [user, userLoaded, currRoom]);

  const setupSocketIO = () => {
    console.log("setting socket");
    if (!user) return null;
    const _socket = io(
      process.env.NODE_ENV === "development"
        ? "ws://localhost:3333"
        : // "wss://dev3333.codingducks.xyz"
          "wss://api2.codingducks.xyz",
      { query: { userId: user.id } }
    );
    _socket.emit(
      USER_JOIN_DUCKLET,
      { room: { id: roomId }, user: { id: user.id } },
      (res) => {
        const { status, error, msg } = res;
        if (status === "error") {
          // setUserIsNotAllowed(true);
          // setUserIsNotAllowedError(msg);
          return;
        }
        if (currRoom) {
          console.log("setting up yjs");
          setupYjs(currRoom);
        }
        // setUserIsNotAllowed(false);
        // setUserIsNotAllowedError("");
        // toast({
        //   title: "Room joined",
        //   description: `You've joined ${currRoom.name}`,
        //   status: "success",
        //   isClosable: true,
        // });
      }
    );
    _socket.on(USER_JOIN_REQUEST_ACCEPTED, (payload) => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      toast({
        title: "Request Accepted!",
        description: `Your request has been accepted!`,
        status: "success",
        isClosable: true,
      });
    });
    _socket.on(ROOM_UPDATED, (payload: RoomUpdated) => {
      // console.log("room updated", payload);
    });
    _socket.on(USER_JOIN_REQUESTED, (payload: UserJoinRequest) => {
      const { user, room } = payload;
      setRequestingUser(user);
      onAllowRequestModalOpen();
    });
    _socket.on(USER_REMOVED_FROM_DUCKLET, (payload) => {
      // fuck clean code, this shit right here works!
      if (typeof window !== "undefined") {
        setTimeout(() => {
          if (currRoom?.isPublic)
            window.location.href = `/ducklets/${roomId}/guest-mode`;
          else window.location.href = `/ducklets`;
        }, 2000);
      }
      toast({
        title: "You have been banned!",
        description: "Project owner has kicked you out.",
        status: "error",
        isClosable: true,
        duration: 5000,
      });
    });
    setSocket(_socket);
  };
  const setupYjs = (room: ISocketRoom) => {
    if (!user || !room) return null;
    const _provider = new WebsocketProvider(
      process.env.NODE_ENV === "development"
        ? "ws://localhost:3334"
        : "wss://yjs.codingducks.xyz",
      "room:" + room.id,
      yDoc
    );

    _provider.awareness.on("update", (changes) => {
      const _clients = Array.from(_provider.awareness.getStates().values()).map(
        (v) => v.user
      );
      setClients(_clients);
    });
    // yDoc.on("afterTransaction", (tr: Y.Transaction, doc: Y.Doc) => {
    //   console.log(doc);
    // });
    yDoc.on(
      "updateV2",
      (update: Uint8Array, origin: any, doc: Y.Doc, tr: Y.Transaction) => {
        const _head = doc.getText("contentHEAD").toJSON();
        const _html = doc.getText("contentHTML").toJSON();
        const _css = doc.getText("contentCSS").toJSON();
        const _js = doc.getText("contentJS").toJSON();

        renderView({
          contentHEAD: _head,
          contentHTML: _html,
          contentCSS: _css,
          contentJS: _js,
        });
        if (tr.local) saveContentsInDB();
      }
    );
    // _provider.on("status", (status) => {
    //   console.log(status);
    //   if (status === "connected") {
    //   }
    // });

    // Initialize provider
    _provider.awareness.setLocalStateField("user", {
      name: user.username,
      color: getRandColor().value,
      photoURL: user.photoURL,
      username: user.username,
      fullname: user.fullname,
      id: user.id,
      clientId: _provider.awareness.clientID,
    });
    // testing: send user pointer pos
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", (e) =>
        updateUserPointerPos(_provider, e)
      );
    }
    // update clients
    setProvider(_provider);
  };
  const renderView = debounce(
    ({
      contentHEAD,
      contentHTML,
      contentCSS,
      contentJS,
    }: {
      contentHEAD: string;
      contentHTML: string;
      contentCSS: string;
      contentJS: string;
    }) => {
      setSrcDoc(
        `<html>
  <head>${contentHEAD}</head>
  <body>${contentHTML}</body>
  <style>${contentCSS}</style>
  <script>${contentJS}</script>
  <script>const as = document.querySelectorAll('a')
as.forEach(a=>{
  a.href = "javascript:void(0)"
})</script>
</html>`
      );
    },
    1000
  );
  const updateUserPointerPos = (provider: WebsocketProvider, e: MouseEvent) => {
    debounce((e) => {
      provider.awareness.setLocalStateField("user", {
        // @ts-ignore
        ...provider.awareness.getLocalState().user,
        pos: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
      });
    }, 10);
  };
  const saveContentsInDB = debounce(() => {
    if (!currRoom) {
      console.error("not in a room, cant save");
      return;
    }
    const contentHEAD = yDoc.getText("contentHEAD").toJSON();
    const contentHTML = yDoc.getText("contentHTML").toJSON();
    const contentCSS = yDoc.getText("contentCSS").toJSON();
    const contentJS = yDoc.getText("contentJS").toJSON();

    mutateRoomContents(
      {
        roomId: +currRoom.id,
        contents: {
          head: contentHEAD,
          html: contentHTML,
          css: contentCSS,
          js: contentJS,
        },
      },
      {
        onSettled(data, error, variables, context) {
          // console.log("ydoc stored");
        },
      }
    );
  }, 1000);

  const handleSettingsChanged = async ({
    roomName,
    description,
    isPublic,
  }: {
    roomName: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!currRoom || !currRoom.id) return console.error("no room id");
    if (currRoom.ownerId !== user?.id) {
      return toast({
        title: "Error",
        description: "You are not the owner of this room",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    mutateRoom(
      {
        roomId: +currRoom?.id,
        roomName,
        description,
        isPublic,
      },
      {
        onSettled(data, error, variables, context) {
          if (error) {
            toast({
              title: "Error",
              description: "Something went wrong. Please try again.",
              status: "error",
              isClosable: true,
            });
            return;
          }
          refetchCurrRoom();
          socket?.emit(ROOM_UPDATED, { updatedRoom: data, user } as RoomUpdate);
        },
      }
    );
  };
  const handleRequestAccess = async () => {
    if (!socket?.emit || !user) return;
    setWatingForJoinRequest(true);
    setTimeout(() => {
      setWatingForJoinRequest(false);
      toast({
        title: "Request not accepted",
        description: "The owner has not accepted your request",
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }, 5000);
    socket.emit(
      USER_JOIN_REQUEST,
      { roomId: currRoom?.id, userId: user.id },
      (res) => {
        console.log(res);
      }
    );
  };
  if (isLoading || !role) return <Spinner />;

  // @ts-ignore
  // if (!socket || (isErrorRoomData && errorRoomData.data.code === 409)) {
  //   return (
  //     <Center h={"100dvh"} w={"full"}>
  //       <VStack>
  //         <Text>Cant join a private room. login to request access</Text>
  //         <Link href={`/login?from=ducklets/${roomId}`}>
  //           <Button colorScheme="purple">Login / Signup</Button>
  //         </Link>
  //       </VStack>
  //     </Center>
  //   );
  // }

  /**
   * ROOM NOT FOUND | ANY => nothing
   * */
  // @ts-ignore
  if (!currRoom || (isErrorRoomData && errorRoomData.data.code === 404)) {
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
  }

  if (role === "requester") {
    return (
      <Center h={"100dvh"} w={"full"}>
        <SetMeta title="Room is private" />
        <VStack>
          <Text>You are not allowed in this private room</Text>
          {/* @ts-ignore */}
          <Button
            colorScheme="purple"
            onClick={handleRequestAccess}
            isLoading={waitingForJoinRequest}
          >
            Request access
          </Button>
          <Link href="/ducklets">
            <Button>Go Home</Button>
          </Link>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      <Flex direction={"column"} h={"100%"}>
        {clients
          .filter((c) => c.username !== user?.username)
          .map(
            (c) =>
              c.pos && (
                <Box
                  key={c.username}
                  position={"absolute"}
                  left={c.pos.x * window.innerWidth || 0}
                  top={c.pos.y * window.innerHeight || 0}
                  zIndex={9999}
                  transition={"all 0.3s ease"}
                >
                  <Box h={5} w={5}>
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      width="24"
                      height="24"
                      viewBox="0 0 32 32"
                      fill={c.color}
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: c.color }}
                    >
                      <path d="m27.34 12.06-22-8a1 1 0 0 0-1.28 1.28l8 22a1 1 0 0 0 1.87.03l3.84-9.6 9.6-3.84a1 1 0 0 0 0-1.87h-.03Zm-10.71 4-.4.16-.16.4L13 24.2 6.67 6.67 24.2 13l-7.57 3.06Z"></path>
                    </svg>
                  </Box>
                  <Badge
                    position={"absolute"}
                    top={5}
                    left={5}
                    borderRadius={"full"}
                    color={"white"}
                    bg={c.color}
                    // w={"100px"}
                    px={2}
                    py={1}
                  >
                    {c.username}
                  </Badge>
                </Box>
              )
          )}
        <DuckletsNavbar
          room={currRoom}
          handleSettingsChanged={handleSettingsChanged}
          refetchCurrRoom={refetchCurrRoom}
          roomMutationLoading={roomMutationLoading}
          clients={clients}
          layout={layout}
          setLayout={setLayout}
          roomRole={role}
        />
        <Box
          width={"100vw"}
          h={"100%"}
          overflow={"hidden"}
          //   bg={"#282A36"}
        >
          {isMobile ? (
            <MobileView provider={provider} srcDoc={srcDoc} yDoc={yDoc} />
          ) : (
            <DesktopView
              layout={layout}
              provider={provider}
              srcDoc={srcDoc}
              yDoc={yDoc}
            />
          )}
        </Box>
      </Flex>
      <Modal
        isOpen={isAllowRequestModalOpen}
        onClose={onAllowRequestModalClose}
      >
        <ModalOverlay />
        {requestingUser && (
          <ModalContent>
            <ModalHeader>Join Request</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              A User wants to join you room
              <HStack>
                {requestingUser.photoURL && (
                  <UserAvatar
                    src={requestingUser.photoURL}
                    alt="profile pic"
                    w={40}
                    h={40}
                  />
                )}
                <VStack>
                  <Text>{requestingUser.fullname}</Text>
                  <Text>{requestingUser.username}</Text>
                </VStack>
              </HStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} variant="ghost" onClick={onAllowRequestModalClose}>
                Ignore
              </Button>
              <Button
                colorScheme="purple"
                onClick={() => {
                  if (!requestingUser.id) return;
                  mutateAllowList(
                    {
                      op: "add",
                      roomId: currRoom.id,
                      userId: requestingUser.id,
                    },
                    {
                      onSuccess: () => {
                        onAllowRequestModalClose();
                        refetchCurrRoom();
                        if (!socket) return;
                        socket.emit(USER_JOIN_REQUEST_ACCEPT, {
                          userId: requestingUser.id,
                          roomId: currRoom.id,
                        });
                        toast({
                          title: "Request accepted",
                          description: `${requestingUser.fullname} can join your room`,
                          status: "success",
                          duration: 5000,
                          isClosable: true,
                        });
                      },
                    }
                  );
                }}
              >
                Accept
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
      {isDrawerOpen && user && (
        <Drawer
          placement={"left"}
          onClose={onDrawerClose}
          isOpen={isDrawerOpen}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader borderBottomWidth="1px">Your Ducklets</DrawerHeader>
            <DrawerBody px={2}>
              <DucksletsList userId={user.id} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
export default DuckletPage;

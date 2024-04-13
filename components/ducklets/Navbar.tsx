import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  ISocketRoom,
  IYJsUser,
  MESSAGE_RECEIVE,
} from "../../lib/socketio/socketEvents";
import FAIcon from "../FAIcon";
import {
  faComment,
  faEye,
  faEyeSlash,
  faFile,
  faTableColumns,
  faWindowMaximize,
} from "@fortawesome/free-solid-svg-icons";
import DucksletsList from "./DucksletsList";
import Link from "next/link";
import { ChatIcon, ChevronLeftIcon, WarningTwoIcon } from "@chakra-ui/icons";
import UserAvatar from "../utils/UserAvatar";
import { Dispatch, SetStateAction, use, useEffect, useState } from "react";
import ChatMessages from "components/ChatMessage";
import useGlobalStore from "stores";
import { userContext } from "contexts/userContext";
import { IMessage } from "lib/socketio/socketEventTypes";
import { getRoomMsgs } from "hooks/useRoomsData";
import { useParams } from "next/navigation";
import { RoomRole } from "types";
import RequestEditAccess from "./RequestEditAccess";
import DuckletSettingsMenu from "./DuckletSettingsMenu";

interface IDuckeletsNavbarProps {
  room: ISocketRoom;
  handleSettingsChanged?: ({
    roomName,
    isPublic,
  }: {
    roomName: string;
    isPublic: boolean;
  }) => void;
  refetchCurrRoom?: () => void;
  roomMutationLoading?: boolean;
  clients?: IYJsUser[];
  layout: "vertical" | "horizontal";
  setLayout: Dispatch<SetStateAction<"horizontal" | "vertical">>;
  roomRole: RoomRole;
}
const DuckletsNavbar = ({
  room,
  handleSettingsChanged,
  refetchCurrRoom,
  roomMutationLoading,
  clients,
  layout,
  setLayout,
  roomRole,
}: IDuckeletsNavbarProps) => {
  const { user, userLoaded } = use(userContext);
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();
  const userIsGuest = userLoaded && !user;
  const [isMobile] = useMediaQuery("(max-width: 650px)");
  const socket = useGlobalStore((state) => state.socket);

  const msgsList = useGlobalStore((state) => state.msgsList);
  const setMsgsList = useGlobalStore((state) => state.setMsgsList);
  const pushNewMsg = useGlobalStore((state) => state.pushNewMsg);

  const [unReadMsgsCount, setUnReadMsgsCount] = useState(msgsList.length);

  const { roomId } = useParams() as { roomId: string };
  useEffect(() => {
    if (!socket) return;
    const fetchMsgs = async () => {
      const { data } = await getRoomMsgs(+roomId);
      setMsgsList(data);
      setUnReadMsgsCount(data.length);
    };
    fetchMsgs();

    socket.on(MESSAGE_RECEIVE, (newMsg: IMessage) => {
      pushNewMsg(newMsg);
      if (!isDrawerOpen) setUnReadMsgsCount((p) => p + 1);
    });
  }, [socket]);
  return (
    <HStack
      h={"48px"}
      w={"100vw"}
      px={"1rem"}
      justifyContent={"space-between"}
      position={"relative"}
    >
      <HStack>
        <Box pos={"relative"}>
          <IconButton
            onClick={() => {
              onDrawerOpen();
              setUnReadMsgsCount(0);
            }}
            icon={<FAIcon icon={faComment} fontSize={"1rem"} />}
            aria-label="open drawer"
          />
          <Box
            bg="red.500"
            pos={"absolute"}
            top={-2}
            right={-2}
            w={"fit-content"}
            px={1}
            borderRadius={"full"}
          >
            <Text fontSize={".9rem"} fontWeight={"bold"} color={"white"}>
              {unReadMsgsCount > 0 ? unReadMsgsCount : null}
            </Text>
          </Box>
        </Box>

        <Drawer
          placement={"left"}
          onClose={onDrawerClose}
          isOpen={isDrawerOpen}
        >
          <DrawerOverlay />
          <DrawerContent>
            {isMobile && (
              <DrawerHeader borderBottomWidth="1px" p={1}>
                <VStack alignItems={"start"}>
                  <Button variant={"outline"} leftIcon={<ChevronLeftIcon />}>
                    home
                  </Button>
                </VStack>
              </DrawerHeader>
            )}
            <DrawerBody p={1}>
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>
                    <HStack>
                      <ChatIcon />
                      <Text>Chat</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack>
                      <FAIcon icon={faFile} />
                      <Text>Ducklets</Text>
                    </HStack>
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {userIsGuest ? (
                      <VStack>
                        <Text>Login to see chat</Text>
                        <Link href={`/login?from=ducklets/${roomId}`}>
                          <Button colorScheme="purple">Login</Button>
                        </Link>
                      </VStack>
                    ) : (
                      !userIsGuest &&
                      socket && (
                        <ChatMessages
                          socket={socket}
                          msgsList={msgsList}
                          user={user}
                          roomInfo={{ id: room.id }}
                        />
                      )
                    )}
                  </TabPanel>
                  <TabPanel>
                    {userIsGuest ? (
                      <VStack>
                        <Text>Login to see your projects</Text>
                        <Link href={`/login?from=ducklets/${roomId}`}>
                          <Button colorScheme="purple">Login</Button>
                        </Link>
                      </VStack>
                    ) : (
                      <DucksletsList userId={user ? user.id : 0} />
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {!isMobile && (
          <Link href={"/ducklets"}>
            <Button variant={"outline"}>
              <Text fontWeight={"bold"}>Home</Text>
            </Button>
          </Link>
        )}
      </HStack>
      <HStack
        pos={isMobile ? "inherit" : "absolute"}
        left={isMobile ? "" : "50%"}
        transform={isMobile ? "" : "translateX(-50%)"}
        h={"full"}
      >
        <DuckletSettingsMenu
          isMobile={isMobile}
          // @ts-ignore
          handleSettingsChanged={handleSettingsChanged}
          // @ts-ignore
          mutationLoading={roomMutationLoading}
          // @ts-ignore
          refetchCurrRoom={refetchCurrRoom}
          room={room}
        />
      </HStack>

      <HStack justifyContent={"end"}>
        {!isMobile && (
          <>
            <Tooltip hasArrow label="Change layout">
              <Button
                aria-label="change layout"
                onClick={() => {
                  setLayout((p) => {
                    if (p === "horizontal") return "vertical";
                    else return "horizontal";
                  });
                }}
                variant={"ghost"}
                position={"relative"}
              >
                <Box
                  position={"absolute"}
                  left={layout === "horizontal" ? 2 : 10}
                  transition={"left 0.3s ease"}
                  right={0}
                  bg={"purple.400"}
                  borderRadius={5}
                  w={8}
                  h={8}
                ></Box>
                <HStack zIndex={1} gap={4}>
                  <FAIcon icon={faTableColumns} fontSize={"1rem"} />
                  <FAIcon icon={faWindowMaximize} fontSize={"1rem"} />
                </HStack>
              </Button>
            </Tooltip>
            {/* <FAIcon icon={faCircle} fontSize={"0.5rem"} /> */}
          </>
        )}
        {!userIsGuest && !isMobile && (
          <Tooltip
            hasArrow
            label={`This ducklet is ${room.isPublic ? "public" : "private"}`}
          >
            <HStack>
              {room?.isPublic ? (
                <HStack>
                  <FAIcon icon={faEye} fontSize={"1rem"} />
                </HStack>
              ) : (
                <HStack>
                  <FAIcon icon={faEyeSlash} fontSize={"1rem"} />
                </HStack>
              )}
            </HStack>
          </Tooltip>
        )}
        {!userIsGuest && (
          <HStack>
            {/* {!isMobile && <FAIcon icon={faCircle} fontSize={"0.5rem"} />} */}
            {clients &&
              clients.map((client) => (
                <UserAvatar
                  key={client.clientId}
                  src={client.photoURL || ""}
                  name={client.username}
                  alt={"profile picture"}
                  w={40}
                  h={40}
                  style={{
                    borderRadius: "50%",
                    border: "3px solid " + client.color,
                  }}
                />
              ))}
          </HStack>
        )}
        {userIsGuest && (
          <Tooltip
            label="Guest mode projects arent synced with cloud"
            bg={"yellow.400"}
            // defaultIsOpen
            hasArrow
            aria-label="A tooltip"
          >
            <WarningTwoIcon
              fontSize={"1.5rem"}
              color={"yellow.400"}
              animation={"warning 3s linear infinite"}
            />
          </Tooltip>
        )}
        {roomRole === "guest" && <RequestEditAccess currRoom={room} />}
      </HStack>
    </HStack>
  );
};

export default DuckletsNavbar;

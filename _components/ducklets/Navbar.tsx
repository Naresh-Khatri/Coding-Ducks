import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Icon,
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
import {
  ChatIcon,
  ChevronLeftIcon,
  SettingsIcon,
  WarningTwoIcon,
} from "@chakra-ui/icons";
import UserAvatar from "../utils/UserAvatar";
import { Dispatch, SetStateAction, use, useEffect, useState } from "react";
import ChatMessages from "_components/ChatMessage";
import useGlobalStore, { useDuckletStore } from "stores";
import { userContext } from "contexts/userContext";
import { IMessage } from "lib/socketio/socketEventTypes";
import { getRoomMsgs } from "hooks/useRoomsData";
import { useParams } from "next/navigation";
import { RoomRole } from "types";
import RequestEditAccess from "./RequestEditAccess";
import DuckletSettingsMenu from "./DuckletSettingsMenu";
import ClientsDrawer from "./ClientsDrawer";
import LayoutSwitcher from "./LayoutSwitcher";
import EditorSettingsModal from "./EditorSettingsModal";

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
  roomRole: RoomRole;
  guestMode?: boolean;
  htmlHead?: string;
  setHtmlHead?: Dispatch<SetStateAction<string>>;
}
const DuckletsNavbar = ({
  room,
  handleSettingsChanged,
  refetchCurrRoom,
  roomMutationLoading,
  clients,
  roomRole,
  guestMode = false,
  htmlHead,
  setHtmlHead,
}: IDuckeletsNavbarProps) => {
  const { user, userLoaded } = use(userContext);
  const userIsGuest = userLoaded && !user;
  const { roomId } = useParams() as { roomId: string };

  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();
  const {
    isOpen: isEditorSettingsModalOpen,
    onOpen: onEditorSettingsModalOpen,
    onClose: onEditorSettingsModalClose,
  } = useDisclosure();
  const [isMobile] = useMediaQuery("(max-width: 650px)");

  const socket = useGlobalStore((state) => state.socket);
  const msgsList = useGlobalStore((state) => state.msgsList);
  const setMsgsList = useGlobalStore((state) => state.setMsgsList);
  const pushNewMsg = useGlobalStore((state) => state.pushNewMsg);

  const [unReadMsgsCount, setUnReadMsgsCount] = useState(msgsList.length);

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
      h={"4rem"}
      w={"100vw"}
      px={"1rem"}
      justifyContent={"space-between"}
      position={"relative"}
    >
      <HStack>
        {!isMobile && (
          <Link href={"/ducklets"}>
            <Button variant={"outline"} leftIcon={<ChevronLeftIcon />}>
              <Text fontWeight={"bold"}>Back</Text>
            </Button>
          </Link>
        )}
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
      </HStack>
      <HStack
        pos={isMobile ? "inherit" : "absolute"}
        left={isMobile ? "" : "50%"}
        transform={isMobile ? "" : "translateX(-50%)"}
        h={"full"}
      >
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
        {userIsGuest && (
          <Tooltip
            label="Ducklets in guest mode wont sync with cloud"
            right={"10px"}
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

      <HStack justifyContent={"end"} alignItems={"center"}>
        {!isMobile && <LayoutSwitcher />}
        {!userIsGuest && clients && (
          <ClientsDrawer clients={clients} room={room} />
        )}
        {roomRole === "guest" && <RequestEditAccess currRoom={room} />}

        <IconButton
          icon={<SettingsIcon />}
          aria-label="Settings"
          size={"sm"}
          onClick={onEditorSettingsModalOpen}
        />

        {isEditorSettingsModalOpen && (
          <EditorSettingsModal
            isOpen={isEditorSettingsModalOpen}
            onClose={onEditorSettingsModalClose}
            onOpen={onEditorSettingsModalOpen}
            guestMode={false}
            htmlHead={htmlHead}
            setHtmlHead={setHtmlHead}
          />
        )}
      </HStack>
    </HStack>
  );
};

export default DuckletsNavbar;

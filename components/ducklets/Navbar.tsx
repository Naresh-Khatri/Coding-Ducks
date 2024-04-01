import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  ISocketRoom,
  ISocketUser,
  IYJsUser,
} from "../../lib/socketio/socketEvents";
import { IUser } from "../../types";
import FAIcon from "../FAIcon";
import {
  faBars,
  faCircle,
  faEye,
  faEyeSlash,
  faList,
  faTableColumns,
  faWindowMaximize,
  faWindowMinimize,
} from "@fortawesome/free-solid-svg-icons";
import DucksletsList from "./DucksletsList";
import Link from "next/link";
import Image from "next/image";
import { getTimeAgo } from "../../lib/formatDate";
import { ChevronLeftIcon, WarningTwoIcon } from "@chakra-ui/icons";
import ShareMenu from "./ShareMenu";
import SettingsMenu from "./SettingsMenu";
import UserAvatar from "../utils/UserAvatar";
import { Dispatch, SetStateAction } from "react";

interface IDuckeletsNavbarProps {
  user: IUser | null;
  userLoaded: boolean;
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
}
const DuckletsNavbar = ({
  room,
  user,
  userLoaded,
  handleSettingsChanged,
  refetchCurrRoom,
  roomMutationLoading,
  clients,
  layout,
  setLayout,
}: IDuckeletsNavbarProps) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();
  const userIsGuest = userLoaded && !user;
  const [isMobile] = useMediaQuery("(max-width: 650px)");

  return (
    <HStack
      h={"48px"}
      w={"100vw"}
      px={"1rem"}
      justifyContent={"space-between"}
      position={"relative"}
    >
      <HStack>
        <IconButton
          onClick={onDrawerOpen}
          icon={<FAIcon icon={faBars} fontSize={"1rem"} />}
          aria-label="open drawer"
        />

        <Drawer
          placement={"left"}
          onClose={onDrawerClose}
          isOpen={isDrawerOpen}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader borderBottomWidth="1px">
              <VStack alignItems={"start"}>
                {isMobile && (
                  <Button variant={"outline"} leftIcon={<ChevronLeftIcon />}>
                    home
                  </Button>
                )}
                <Text>Your Ducklets</Text>
              </VStack>
            </DrawerHeader>
            <DrawerBody>
              {userIsGuest ? (
                <VStack>
                  <Text>Login to see your projects</Text>
                  <Link href={"/login"}>
                    <Button colorScheme="purple">Login</Button>
                  </Link>
                </VStack>
              ) : (
                <DucksletsList userId={user ? user.id : 0} />
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {!isMobile && (
          <Button variant={"ghost"}>
            <Link href={"/"}>
              <Text fontWeight={"bold"}>Home</Text>
            </Link>
          </Button>
        )}
      </HStack>
      <HStack
        pos={isMobile ? "inherit" : "absolute"}
        left={isMobile ? "" : "50%"}
        transform={isMobile ? "" : "translateX(-50%)"}
        h={"full"}
      >
        <Popover>
          <PopoverTrigger>
            <Button variant={"ghost"} h={"full"}>
              <HStack w={"fit-content"}>
                <UserAvatar
                  src={room.owner?.photoURL || ""}
                  alt="profile pic"
                  w={30}
                  h={30}
                  style={{
                    borderRadius: "50%",
                  }}
                />
                <VStack alignItems={"flex-start"}>
                  <HStack>
                    <Text
                      lineHeight={0.7}
                      fontWeight={"bold"}
                      fontSize={"1.1rem"}
                      maxW={isMobile ? "120px" : "fit-content"}
                      textOverflow={"ellipsis"}
                      overflow={"hidden"}
                    >
                      {room.name}
                    </Text>
                    <Text>{userIsGuest && "(Guest Most)"}</Text>
                  </HStack>

                  <Text lineHeight={0.7} fontSize={"0.8rem"} color={"gray.500"}>
                    {room.owner?.username}
                  </Text>
                </VStack>
              </HStack>
            </Button>
          </PopoverTrigger>
          <Portal>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Ducklet Info</PopoverHeader>
              <PopoverBody>
                <Text>Name: {room.name}</Text>
                <Text>Description: {room.description}</Text>
                <Text>Visibility: {room.isPublic ? "Public" : "Private"}</Text>
                <Text>
                  Updated : {room.updatedAt ? getTimeAgo(room.updatedAt) : "NA"}
                </Text>
                <Text>
                  Created : {room.createdAt ? getTimeAgo(room.createdAt) : "NA"}
                </Text>
                <HStack>
                  <Text> Allowed users:</Text>
                  {room.allowedUsers?.map((user) => {
                    return (
                      <Link href={"/users/" + user.username} key={user.id}>
                        <UserAvatar
                          src={user?.photoURL || ""}
                          name={user?.username}
                          alt="profile pic"
                          w={30}
                          h={30}
                          style={{
                            borderRadius: "50%",
                          }}
                        />
                      </Link>
                    );
                  })}
                </HStack>
                <HStack></HStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
        {!isMobile && <ShareMenu />}
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
            <FAIcon icon={faCircle} fontSize={"0.5rem"} />
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
                  <Text color={"green"}>(Public)</Text>
                </HStack>
              ) : (
                <HStack>
                  <FAIcon icon={faEyeSlash} fontSize={"1rem"} />
                  <Text color={"red"}>(Private)</Text>
                </HStack>
              )}
            </HStack>
          </Tooltip>
        )}
        {!userIsGuest && (
          <HStack>
            {!isMobile && <FAIcon icon={faCircle} fontSize={"0.5rem"} />}
            {clients &&
              clients.map((client) => (
                <UserAvatar
                  key={client.clientId}
                  src={client.photoURL || ""}
                  name={client.fullname}
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
        {userIsGuest && !isMobile && (
          <Tooltip
            label="Guest mode projects arent synced with cloud"
            bg={"yellow.400"}
            // defaultIsOpen
            aria-label="A tooltip"
          >
            <WarningTwoIcon
              fontSize={"1.5rem"}
              color={"yellow.400"}
              animation={"warning 3s linear infinite"}
            />
          </Tooltip>
        )}
        {userIsGuest &&
          (isMobile ? (
            <Link href={"/login"}>
              <Button colorScheme="purple" size={"sm"}>
                <Text lineHeight={0.7}>Sign Up</Text>
              </Button>
            </Link>
          ) : (
            <>
              <Link href={"/login"}>
                <Button colorScheme="purple">Sign Up</Button>
              </Link>
              <Link href={"/login"}>
                <Button>Login</Button>
              </Link>
            </>
          ))}
        {!userIsGuest && (
          <SettingsMenu
            room={room}
            // @ts-ignore
            handleSettingsChanged={handleSettingsChanged}
            // @ts-ignore
            refetchCurrRoom={refetchCurrRoom}
            // @ts-ignore
            mutationLoading={roomMutationLoading}
            user={user as ISocketUser}
          />
        )}
      </HStack>
    </HStack>
  );
};

export default DuckletsNavbar;

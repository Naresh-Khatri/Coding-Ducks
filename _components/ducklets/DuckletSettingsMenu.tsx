import {
  AddIcon,
  CloseIcon,
  DeleteIcon,
  InfoIcon,
  Search2Icon,
  SettingsIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Spinner,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { faGlobe, faLock } from "@fortawesome/free-solid-svg-icons";
import FAIcon from "_components/FAIcon";
import UserAvatar from "_components/utils/UserAvatar";
import { userContext } from "contexts/userContext";
import { useUpdateAllowList } from "hooks/useRoomsData";
import { useUsersSearch } from "hooks/useUsersData";
import {
  ISocketRoom,
  ISocketUser,
  USER_REMOVE_FROM_DUCKLET,
} from "lib/socketio/socketEvents";
import React, { use, useEffect, useState } from "react";
import useGlobalStore from "stores";
import ShareMenu from "./ShareMenu";

function DuckletSettingsMenu({
  room,
  isMobile,
  handleSettingsChanged,
  refetchCurrRoom,
  mutationLoading,
}: {
  room: ISocketRoom;
  isMobile: boolean;
  mutationLoading: boolean;
  refetchCurrRoom: () => void;
  handleSettingsChanged: ({
    roomName,
    description,
    isPublic,
  }: {
    roomName: string;
    description: string;
    isPublic: boolean;
  }) => void;
}) {
  const { user, userLoaded } = use(userContext);
  const [roomName, setRoomName] = useState(room.name);
  const [description, setDescription] = useState(room.description || "");
  const [isPublic, setIsPublic] = useState(room.isPublic || false);
  const [username, setUsername] = useState("");

  const socket = useGlobalStore((state) => state.socket);

  const selfIsOwner = user && user.id === room.ownerId;

  const {
    data: searchedUsers,
    isLoading,
    error,
    refetch,
  } = useUsersSearch(username);
  const {
    data: update,
    isLoading: mutateAllowListLoading,
    error: mutateAllowListError,
    mutate: mutateAllowList,
  } = useUpdateAllowList();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim().length > 3) refetch();
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [username]);

  if (!userLoaded || !room.owner) return <Spinner />;
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant={"ghost"}>
          <HStack w={"fit-content"} h={"full"}>
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
                <Text>{!user && "(Guest Mode)"}</Text>
              </HStack>

              <Text lineHeight={0.7} fontSize={"0.8rem"} color={"gray.500"}>
                {room.owner?.username}
              </Text>
            </VStack>
            <Divider orientation="vertical" />

            <InfoIcon />
          </HStack>
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent pb={"2rem"}>
          <PopoverArrow />
          <PopoverHeader>
            <HStack justifyContent={"space-between"}>
              <Text fontWeight={"bold"} fontSize={"lg"}>
                {selfIsOwner ? "Edit your ducklet" : "Ducklet Info"}
              </Text>
              <ShareMenu />
            </HStack>
          </PopoverHeader>
          {/* <PopoverCloseButton /> */}
          <PopoverBody>
            <FormControl>
              <VStack gap={0} mt={"1rem"} alignItems={"flex-start"}>
                <FormLabel htmlFor="roomname">
                  <Text fontWeight={"bold"}>Ducklet name:</Text>
                </FormLabel>
                <HStack w="full">
                  <Input
                    id="roomname"
                    value={roomName}
                    w={"100%"}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      handleSettingsChanged({
                        roomName: e.target.value,
                        description,
                        isPublic,
                      });
                    }}
                    isDisabled={!selfIsOwner}
                    readOnly={!selfIsOwner}
                  />
                </HStack>
              </VStack>
              <VStack gap={0} mt={"1.5rem"} alignItems={"flex-start"}>
                <FormLabel htmlFor="description">
                  <Text fontWeight={"bold"}>Description:</Text>
                </FormLabel>
                <HStack w="full">
                  <Textarea
                    id="description"
                    value={description}
                    w={"100%"}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      handleSettingsChanged({
                        roomName,
                        description: e.target.value,
                        isPublic,
                      });
                    }}
                    isDisabled={!selfIsOwner}
                    readOnly={!selfIsOwner}
                  />
                </HStack>
              </VStack>

              <FormControl mt={4}>
                <FormLabel fontWeight={"bold"}>Visibility</FormLabel>
                <Button
                  variant={"ghost"}
                  px={0}
                  _hover={{}}
                  _focus={{}}
                  _active={{}}
                  onClick={() => {
                    setIsPublic(!isPublic);
                    handleSettingsChanged({
                      roomName,
                      description,
                      isPublic: !isPublic,
                    });
                  }}
                  isDisabled={!selfIsOwner}
                  // readOnly={!selfIsOwner}
                >
                  <HStack
                    bg={!isPublic ? "red.400" : ""}
                    px={2}
                    py={1}
                    borderRadius={"5px"}
                  >
                    <FAIcon icon={faLock} />
                    <Text>Private</Text>
                  </HStack>
                  <HStack
                    bg={isPublic ? "green.400" : ""}
                    px={2}
                    py={1}
                    borderRadius={"5px"}
                  >
                    <FAIcon icon={faGlobe} />
                    <Text>Public</Text>
                  </HStack>
                </Button>
              </FormControl>
              <VStack gap={0} mt={"1.5rem"} alignItems={"flex-start"}>
                <FormLabel>
                  <Text fontWeight={"bold"}>Owner:</Text>
                  <UserItem user={room.owner} isOwner />
                </FormLabel>
                {room.allowedUsers && room.allowedUsers?.length > 0 && (
                  <FormLabel>
                    <Text fontWeight={"bold"} mt={"1rem"}>
                      Contributors:
                    </Text>
                  </FormLabel>
                )}
                <Box w={"full"}>
                  {room.allowedUsers?.map((user) => (
                    <UserItem
                      RightBtn={
                        selfIsOwner && (
                          <IconButton
                            bg={"red.400"}
                            icon={<DeleteIcon />}
                            aria-label="delete user"
                            isLoading={mutateAllowListLoading}
                            onClick={() => {
                              if (!user.id) return;
                              mutateAllowList(
                                {
                                  roomId: room.id,
                                  userId: user.id,
                                  op: "remove",
                                },
                                {
                                  onSuccess: () => {
                                    refetchCurrRoom();
                                    socket?.emit(USER_REMOVE_FROM_DUCKLET, {
                                      userId: user.id,
                                    });
                                  },
                                }
                              );
                            }}
                          />
                        )
                      }
                      user={user}
                      key={user.id}
                    />
                  ))}
                </Box>
                {selfIsOwner && (
                  <VStack align={"start"} mt={5}>
                    <FormLabel htmlFor="allowed">
                      <Text fontWeight={"bold"}>Invite users:</Text>
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Search2Icon />
                      </InputLeftElement>
                      <Input
                        id="allowed"
                        value={username}
                        placeholder={"Enter friend's name"}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      <InputRightElement>
                        {username.trim().length > 3 && isLoading ? (
                          <Spinner />
                        ) : (
                          <IconButton
                            variant={"ghost"}
                            icon={<CloseIcon />}
                            aria-label="clear search"
                            onClick={() => setUsername("")}
                          />
                        )}
                      </InputRightElement>
                    </InputGroup>
                  </VStack>
                )}
                {searchedUsers && searchedUsers.length > 0 ? (
                  <Box w={"full"}>
                    {/* dont show current user and already allowed users */}
                    {searchedUsers
                      .filter(
                        (u) =>
                          user &&
                          user.id !== u.id &&
                          room.allowedUsers &&
                          !room.allowedUsers.find((au) => au.id === u.id)
                      )
                      .map((user) => (
                        <UserItem
                          key={user.id}
                          user={user}
                          RightBtn={
                            selfIsOwner && (
                              <IconButton
                                icon={<AddIcon />}
                                aria-label="add user"
                                isLoading={mutateAllowListLoading}
                                onClick={() => {
                                  if (!user.id) return;
                                  mutateAllowList(
                                    {
                                      roomId: room.id,
                                      userId: user.id,
                                      op: "add",
                                    },
                                    {
                                      onSuccess: () => {
                                        refetchCurrRoom();
                                      },
                                    }
                                  );
                                }}
                              />
                            )
                          }
                        />
                      ))}
                  </Box>
                ) : (
                  username.trim().length > 3 && (
                    <Box>
                      <Text>No users found</Text>
                    </Box>
                  )
                )}
              </VStack>
            </FormControl>
          </PopoverBody>
          {/* <PopoverFooter>This is the footer</PopoverFooter> */}
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

export default DuckletSettingsMenu;

const UserItem = ({
  user,
  RightBtn,
  isOwner,
}: {
  user: ISocketUser;
  RightBtn?: React.ReactNode;
  isOwner?: boolean;
}) => {
  return (
    <Box key={user.id} w={"full"} my={1}>
      <HStack justifyContent={"space-between"}>
        <Box>
          <HStack>
            <UserAvatar
              src={user.photoURL || ""}
              alt="profile photo"
              name={user.fullname}
              w={40}
              h={40}
              width="40px"
              height="40px"
            />
            <Box ml={"2rem"} alignItems={"flex-start"}>
              <HStack>
                <Text fontWeight={"bold"}>{user.fullname}</Text>
                <Text fontWeight={"bold"} color={"green.400"}>
                  {isOwner && <Badge colorScheme="green">Owner</Badge>}
                </Text>
              </HStack>
              <Text color={"gray.500"}>{user.username}</Text>
            </Box>
          </HStack>
        </Box>
        <Box>{RightBtn}</Box>
      </HStack>
    </Box>
  );
};

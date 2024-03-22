import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { ReactNode, useEffect, useState } from "react";
import {
  ISocketRoom,
  ISocketUser,
  USER_REMOVE_FROM_DUCKLET,
} from "../../lib/socketio/socketEvents";
import {
  AddIcon,
  CloseIcon,
  DeleteIcon,
  Search2Icon,
  SettingsIcon,
} from "@chakra-ui/icons";
import Image from "next/image";
import { useUsersSearch } from "../../hooks/useUsersData";
import { useUpdateAllowList } from "../../hooks/useRoomsData";
import FAIcon from "../FAIcon";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import useGlobalStore from "../../stores";

function SettingsMenu({
  room,
  handleSettingsChanged,
  refetchCurrRoom,
  mutationLoading,
  user,
}: {
  room: ISocketRoom;
  mutationLoading: boolean;
  user: ISocketUser;
  refetchCurrRoom: () => void;
  handleSettingsChanged: ({
    roomName,
    isPublic,
  }: {
    roomName: string;
    isPublic: boolean;
  }) => void;
}) {
  const [roomName, setRoomName] = useState(room.name);
  const [isPublic, setIsPublic] = useState(room.isPublic || false);
  const [username, setUsername] = useState("");

  const socket = useGlobalStore((state) => state.socket);

  const selfIsOwner = user.id === room.ownerId;

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

  if (!user.id || !room.owner) return <Spinner />;
  return (
    <Menu>
      <MenuButton as={IconButton} icon={<SettingsIcon />}></MenuButton>
      <MenuList p={"1rem"} zIndex={9999}>
        <Text fontWeight={"bold"} fontSize={"lg"}>
          {" "}
          Edit your ducklet
        </Text>

        <FormControl>
          <VStack gap={0} mt={"1.5rem"} alignItems={"flex-start"}>
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
                  handleSettingsChanged({ roomName: e.target.value, isPublic });
                }}
                isDisabled={!selfIsOwner}
                readOnly={!selfIsOwner}
              />
              {/* {room.name !== roomName && (
                <IconButton
                  colorScheme="green"
                  aria-label="save name"
                  onClick={() => handleSettingsChanged({ roomName, isPublic })}
                  icon={<FAIcon icon={faSave} />}
                />
              )} */}
            </HStack>
          </VStack>
          <VStack gap={0} mt={"1.5rem"} alignItems={"flex-start"}>
            <FormLabel>
              <Text fontWeight={"bold"}>Allowed Users:</Text>
            </FormLabel>
            <Box w={"full"}>
              <UserItem user={room.owner} isOwner />
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
                // <Image
                //   key={user.id}
                //   src={user.photoURL || ""}
                //   alt="user"
                //   width={40}
                //   height={40}
                //   style={{ borderRadius: "50%" }}
                // />
              ))}
            </Box>
            {selfIsOwner && (
              <VStack align={"start"} mt={5}>
                <FormLabel htmlFor="allowed">
                  <Text fontWeight={"bold"}>Add others:</Text>
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
                      u.id !== user.id ||
                      (room.allowedUsers &&
                        room.allowedUsers.some((au) => au.id === u.id))
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
          <HStack
            mt={"1.5rem"}
            alignItems={"center"}
            justifyContent={"space-between"}
            w={"full"}
          >
            <HStack alignItems={"center"}>
              <FormLabel htmlFor="isPublic">
                <Text fontWeight={"bold"}>Public:</Text>
              </FormLabel>
              <Switch
                mb={1}
                id="isPublic"
                isChecked={isPublic}
                onChange={() => {
                  setIsPublic(!isPublic);
                  handleSettingsChanged({ roomName, isPublic: !isPublic });
                }}
                isDisabled={!selfIsOwner}
                readOnly={!selfIsOwner}
              />
            </HStack>

            {/* {room.isPublic !== isPublic && (
              <IconButton
                aria-label="save name"
                colorScheme="green"
                onClick={() => handleSettingsChanged({ roomName, isPublic })}
                isLoading={mutationLoading}
                icon={<FAIcon icon={faSave} />}
              />
            )} */}
          </HStack>
          {/* <Button
            mt={4}
            colorScheme="purple"
            type="submit"
            justifySelf={"end"}
            isDisabled={room.name === roomName && room.isPublic === isPublic}
            onClick={() => handleSettingsChanged({ roomName, isPublic })}
            isLoading={mutationLoading}
          >
            Submit
          </Button> */}
        </FormControl>
      </MenuList>
    </Menu>
  );
}

export default SettingsMenu;

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
            {user.photoURL ? (
              <Image
                src={user.photoURL || ""}
                alt="user"
                width={40}
                height={40}
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <Avatar src="" name={user.fullname} />
            )}
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
      <Divider />
    </Box>
  );
};

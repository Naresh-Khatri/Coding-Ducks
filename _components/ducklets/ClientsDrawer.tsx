import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import UserAvatar from "_components/utils/UserAvatar";
import { ISocketRoom, ISocketUser, IYJsUser } from "lib/socketio/socketEvents";
import React from "react";

type DedubplicatedUsers = IYJsUser & { colors: string[] };

function ClientsDrawer({
  clients,
  room,
}: {
  clients: IYJsUser[];
  room: ISocketRoom;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const filteredClients =
    clients.length > 0
      ? clients.reduce((acc: DedubplicatedUsers[], curr: IYJsUser) => {
          const alreadyExistsIdx = acc.findIndex((user) => user.id === curr.id);
          if (alreadyExistsIdx !== -1) {
            acc[alreadyExistsIdx] = {
              ...acc[alreadyExistsIdx],
              colors: [...acc[alreadyExistsIdx].colors, curr.color.value],
            };
          } else {
            acc.push({ ...curr, colors: [curr.color.value] });
          }
          return acc;
        }, [])
      : [];

  return (
    <>
      <HStack cursor={"pointer"} onClick={onOpen}>
        {clients &&
          clients.map((client: IYJsUser, idx: number) => (
            <UserAvatar
              key={idx}
              src={client.photoURL || ""}
              name={client.fullname}
              alt={"profile picture"}
              w={40}
              h={40}
              style={{
                borderRadius: "50%",
                border: "3px solid " + client.color.value,
              }}
            />
          ))}
      </HStack>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Active Users</DrawerHeader>

          <DrawerBody>
            {filteredClients.length > 0 &&
              filteredClients.map((client: DedubplicatedUsers, idx: number) => (
                <UserItem
                  key={idx}
                  user={client}
                  isOwner={client.id === room.ownerId}
                />
              ))}
          </DrawerBody>

          <DrawerFooter>
            {/* <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue">Save</Button> */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

const UserItem = ({
  user,
  RightBtn,
  isOwner,
}: {
  user: DedubplicatedUsers;
  RightBtn?: React.ReactNode;
  isOwner?: boolean;
}) => {
  return (
    <Box key={user.id} w={"full"} my={1}>
      <HStack justifyContent={"space-between"}>
        <Box>
          <HStack>
            <HStack w={"70px"}>
              <Flex w={"40px"} h={"full"} flexDirection={"column"} gap={2}>
                {user.colors.map((color, idx) => (
                  <Box
                    key={idx}
                    w={"40px"}
                    h={"10px"}
                    style={{
                      //   borderRadius: "50%",
                      background: color,
                      border: "3px solid " + color,
                    }}
                  ></Box>
                ))}
              </Flex>
              <UserAvatar
                src={user.photoURL || ""}
                alt="profile photo"
                name={user.fullname}
                w={40}
                h={40}
                width="40px"
                height="40px"
              />
            </HStack>
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

export default ClientsDrawer;

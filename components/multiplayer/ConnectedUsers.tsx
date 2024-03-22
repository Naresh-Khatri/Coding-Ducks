import {
  Avatar,
  AvatarBadge,
  Grid,
  GridItem,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import Image from "next/image";
import type { FC } from "react";
import { IUser } from "../../types";
import { IYJsUser } from "../../lib/socketio/socketEvents";
import ChakraNextImage from "../utils/ChakraNextImage";

interface ConnectedUsersProps {
  clients: IYJsUser[];
  currentUser: IUser;
}

const ConnectedUsers: FC<ConnectedUsersProps> = ({ clients, currentUser }) => {
  return (
    <HStack>
      {clients.map(({ fullname, photoURL, id, clientId, username }) => (
        <HStack key={clientId}>
          <Tooltip hasArrow label="Search places" bg="red.600">
            <ChakraNextImage
              width={30}
              height={30}
              src={photoURL}
              alt="profile photo"
              style={{ borderRadius: "50%", width: "36px", height: "auto" }}
            />
          </Tooltip>
          {/* <Popover>
            <PopoverTrigger>
              <Avatar
                key={socketId}
                name={username}
                src={photoURL}
                size="sm"
                colorScheme="green"
              >
                <AvatarBadge boxSize="1.25em" bg={"green.500"} />
              </Avatar>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>User Info</PopoverHeader>
              <PopoverBody>
                <Grid templateColumns={"repeat(5, 1fr)"}>
                  <GridItem colSpan={1}>
                    <Image
                      width={100}
                      height={100}
                      src={photoURL}
                      alt="profile photo"
                      style={{ borderRadius: "50%" }}
                    />
                  </GridItem>
                  <GridItem colSpan={4} mx={2}>
                    <HStack>
                      <Text>{fullname}</Text>
                      {id === currentUser.id && (
                        <Text as="span" color="green.500">
                          (you)
                        </Text>
                      )}
                    </HStack>
                    <Text color={"gray.500"}>@{username}</Text>
                  </GridItem>
                </Grid>
              </PopoverBody>
            </PopoverContent>
          </Popover> */}
        </HStack>
      ))}
    </HStack>
  );
};

export default ConnectedUsers;

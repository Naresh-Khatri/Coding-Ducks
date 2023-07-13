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
} from "@chakra-ui/react";
import Image from "next/image";
import type { FC } from "react";
import { IUser } from "../../types";

interface Client {
  id: string;
  socketId: string;
}
interface ConnectedUsersProps {
  clients: any[];
  currentUser: IUser;
}

const ConnectedUsers: FC<ConnectedUsersProps> = ({ clients, currentUser }) => {
  return (
    <HStack>
      {Object.keys(clients).map((socketId, i) => (
        <HStack key={socketId}>
          <Popover>
            <PopoverTrigger>
              <Avatar
                key={i}
                name={clients[socketId].username}
                src={clients[socketId].photoURL}
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
                      src={clients[socketId].photoURL}
                      alt="profile photo"
                      style={{ borderRadius: "50%" }}
                    />
                  </GridItem>
                  <GridItem colSpan={4} mx={2}>
                    <HStack>
                      <Text>{clients[socketId].fullname}</Text>
                      {clients[socketId].id === currentUser.id && (
                        <Text as="span" color="green.500">
                          (you)
                        </Text>
                      )}
                    </HStack>
                    <Text color={"gray.500"}>
                      @{clients[socketId].username}
                    </Text>
                  </GridItem>
                </Grid>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
      ))}
    </HStack>
  );
};

export default ConnectedUsers;

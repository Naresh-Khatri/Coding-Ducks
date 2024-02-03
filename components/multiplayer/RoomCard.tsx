import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  HStack,
  Heading,
  SlideFade,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import React from "react";
import { IUser, Lang } from "../../types";
import dynamic from "next/dynamic";
import LangIcon from "../LangIcon";
import { ISocketRoom } from "../../lib/socketio/socketEvents";

// const CodePreview = dynamic(() => import("./CodePreview"), { ssr: false });

function RoomCard({ room }: { room: ISocketRoom }) {
  return (
    <SlideFade in={true} offsetY="20px">
      <Card
        direction={{ base: "column", sm: "row" }}
        overflow="hidden"
        variant="outline"
        _hover={{ border: "1px solid #9d4edd", transition: "border .2s" }}
      >
        <Stack w={"full"}>
          <CardBody>
            <HStack justifyContent={"space-between"}>
              <VStack alignItems={"start"}>
                <Heading size="md">{room.name}</Heading>
                <Text color={"whiteAlpha.500"}>{room.owner.username}</Text>
              </VStack>
              <LangIcon lang={room.lang} height="2rem" />
              {/* <CodePreview code={room.content} lang={room.lang} /> */}
            </HStack>
          </CardBody>

          <CardFooter w={"full"}>
            <HStack
              justifyContent={"space-between"}
              alignItems={"end"}
              w={"full"}
            >
              <VStack alignItems={"start"}>
                <AvatarGroup>
                  {room.clients.map((client, index) => (
                    <Avatar
                      key={client.id + index}
                      name={client.username}
                      src={client.photoURL}
                    />
                  ))}
                </AvatarGroup>
              </VStack>
              <Link href={`/multiplayer/${room.name}`}>
                <Button variant="solid" colorScheme="purple">
                  Join
                </Button>
              </Link>
            </HStack>
          </CardFooter>
        </Stack>
      </Card>
    </SlideFade>
  );
}

export default RoomCard;

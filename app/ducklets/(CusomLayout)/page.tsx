"use client";

import React, { use } from "react";
import { userContext } from "contexts/userContext";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Container,
  Divider,
  HStack,
  Heading,
  SimpleGrid,
  Skeleton,
  SlideFade,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useUserRoomsData } from "hooks/useUsersData";
import Link from "next/link";
import { ISocketRoom } from "lib/socketio/socketEvents";
import { useRoomsData } from "hooks/useRoomsData";
import FAIcon from "components/FAIcon";
import { faGlobe, faLock } from "@fortawesome/free-solid-svg-icons";
import { getTimeAgo } from "lib/formatDate";

function DuckletsPage() {
  const { user, userLoaded } = use(userContext);
  const {
    data: myRooms,
    isLoading: myRoomsLoading,
    error: myRoomsError,
  } = useUserRoomsData({ userId: user?.id || 0 });
  const {
    data: otherRooms,
    isLoading: otherRoomsLoading,
    error: otherRoomsError,
  } = useRoomsData();

  let filteredOtherRooms = otherRooms;
  if (user)
    filteredOtherRooms = otherRooms?.filter((r) => r.ownerId !== user.id);

  return (
    <>
      <Container maxW={"container.xl"} minH={"80vh"}>
        <Text mt={5} fontSize={"2xl"}>
          My ducklets
        </Text>
        <Divider mb={5} />
        {userLoaded && !user ? (
          <Text>Log in to view your ducklets</Text>
        ) : myRoomsLoading ? (
          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={10}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton w={"100%"} h={"128px"} key={i} borderRadius={"5px"} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={10}>
            {myRooms?.map((room) => (
              <RoomCard room={room} key={room.id} isMine />
            ))}
          </SimpleGrid>
        )}

        <Text mt={"4rem"} fontSize={"2xl"}>
          Other user&apos;s ducklets
        </Text>
        <Divider mb={5} />
        {otherRoomsLoading ? (
          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={10}>
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton w={"100%"} h={"128px"} key={i} borderRadius={"5px"} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={10}>
            {filteredOtherRooms?.map((room) => (
              <RoomCard room={room} key={room.id} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </>
  );
}

export default DuckletsPage;

const RoomCard = ({
  room,
  isMine,
}: {
  room: ISocketRoom;
  isMine?: boolean;
}) => {
  return (
    <SlideFade in={true} offsetY="20px">
      <Card
        direction={{ base: "column", sm: "row" }}
        overflow="hidden"
        variant="outline"
        _hover={{ border: "1px solid #9d4edd", transition: "border .2s" }}
      >
        <Stack w={"full"}>
          <CardBody pb={0}>
            <HStack justifyContent={"space-between"} align={"start"}>
              <VStack alignItems={"start"}>
                <Heading size="md">{room.name}</Heading>

                <Text color={"whiteAlpha.500"}>
                  {isMine ? "Me" : room.owner && room.owner.username}
                </Text>
              </VStack>
              <Box>
                {isMine && (
                  <HStack>
                    <FAIcon
                      icon={room.isPublic ? faGlobe : faLock}
                      style={{ color: "#555" }}
                    />
                    <Text color={"whiteAlpha.500"}>
                      {room.isPublic ? "Public" : "Private"}
                    </Text>
                  </HStack>
                )}
              </Box>
              {/* <LangIcon lang={room.lang} height="2rem" /> */}
              {/* <CodePreview code={room.content} lang={room.lang} /> */}
            </HStack>
          </CardBody>

          <CardFooter w={"full"} pt={0}>
            <HStack
              justifyContent={"space-between"}
              alignItems={"end"}
              w={"full"}
            >
              <VStack alignItems={"start"}>
                {room.clients && room.clients.length > 0 && (
                  <AvatarGroup>
                    {room.clients.map((client, index) => (
                      <Avatar
                        key={index}
                        name={client.username}
                        src={client.photoURL}
                      />
                    ))}
                  </AvatarGroup>
                )}
                <Text color={"whiteAlpha.500"}>
                  {room.updatedAt ? getTimeAgo(room.updatedAt) : "NA"}
                </Text>
              </VStack>
              <Link href={`/ducklets/${room.id}`}>
                <Button variant="solid" colorScheme="purple">
                  Open
                </Button>
              </Link>
            </HStack>
          </CardFooter>
        </Stack>
      </Card>
    </SlideFade>
  );
};

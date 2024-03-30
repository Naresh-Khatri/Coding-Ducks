"use client";

import React, { use, useState } from "react";
import { userContext } from "contexts/userContext";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Center,
  Container,
  Divider,
  HStack,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  SlideFade,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useUserRoomsData } from "hooks/useUsersData";
import Link from "next/link";
import { ISocketRoom } from "lib/socketio/socketEvents";
import { useRemoveRoom, useRoomsData } from "hooks/useRoomsData";
import FAIcon from "components/FAIcon";
import { faGlobe, faLock } from "@fortawesome/free-solid-svg-icons";
import { getTimeAgo } from "lib/formatDate";
import UserAvatar from "components/utils/UserAvatar";
import { AddIcon, CloseIcon, DeleteIcon } from "@chakra-ui/icons";
import CreateDuckletModal from "components/ducklets/CreateDuckletModal";

function DuckletsPage() {
  const { user, userLoaded } = use(userContext);
  const {
    data: myRooms,
    isLoading: myRoomsLoading,
    error: myRoomsError,
    refetch: refetchMyRooms,
  } = useUserRoomsData({ userId: user?.id || 0 });
  const {
    data: otherRooms,
    isLoading: otherRoomsLoading,
    error: otherRoomsError,
  } = useRoomsData();

  const { isOpen, onOpen, onClose } = useDisclosure();

  let filteredOtherRooms = otherRooms;
  if (user)
    filteredOtherRooms = otherRooms?.filter((r) => r.ownerId !== user.id);

  return (
    <>
      <Container maxW={"container.xl"} minH={"80vh"}>
        {isOpen && <CreateDuckletModal isOpen={isOpen} onClose={onClose} />}
        <HStack>
          <Text mt={5} fontSize={"2xl"}>
            My ducklets
          </Text>
          <Button
            mt={5}
            leftIcon={<AddIcon />}
            size={"sm"}
            variant={"outline"}
            ml={5}
            colorScheme="purple"
            onClick={onOpen}
          >
            <Text fontSize={"small"}>New</Text>
          </Button>
        </HStack>
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
              <RoomCard
                room={room}
                key={room.id}
                refetch={refetchMyRooms}
                isMine
              />
            ))}
            <CreateRoomCard onOpen={onOpen} />
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

const CreateRoomCard = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <SlideFade in={true} offsetY="20px">
      <Card
        height={"100%"}
        direction={{ base: "column", sm: "row" }}
        overflow="hidden"
        variant="outline"
        _hover={{ border: "1px solid #9d4edd", transition: "border .2s" }}
        onClick={onOpen}
      >
        <CardBody>
          <Center w={"100%"} h={"100%"}>
            <VStack>
              <AddIcon fontSize={"3xl"} />
              <Text>create</Text>
            </VStack>
          </Center>
        </CardBody>
      </Card>
    </SlideFade>
  );
};

const RoomCard = ({
  room,
  isMine,
  refetch,
}: {
  room: ISocketRoom;
  isMine?: boolean;
  refetch?: () => void;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutate } = useRemoveRoom();
  const toast = useToast();
  const handleDuckletRemove = () => {
    mutate(
      { id: room.id },
      {
        onSuccess: () => {
          toast({
            title: "Ducklet removed",
            description: "Ducklet has been removed",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          onClose();
          if (refetch) refetch();
        },
      }
    );
  };
  return (
    <SlideFade in={true} offsetY="20px">
      <Card
        direction={{ base: "column", sm: "row" }}
        variant="outline"
        _hover={{ border: "1px solid #9d4edd", transition: "border .2s" }}
        position={"relative"}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isMine && isHovering && (
          <SlideFade
            in={true}
            offsetY="20px"
            style={{ position: "absolute", right: "-3px", top: "-3px" }}
          >
            <IconButton
              aria-label="delete ducklet"
              onClick={onOpen}
              colorScheme="red"
              icon={<DeleteIcon />}
              size={"sm"}
            />
          </SlideFade>
        )}
        {isOpen && (
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Modal Title</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                Are you sure you want to delete this Ducklet?
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost">No</Button>
                <Button colorScheme="red" mr={3} onClick={handleDuckletRemove}>
                  Delete
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
        <Stack w={"full"}>
          <CardBody pb={0}>
            <HStack justifyContent={"space-between"} align={"start"}>
              <VStack alignItems={"start"}>
                <Heading size="md">{room.name}</Heading>

                <HStack>
                  {room.owner && (
                    <UserAvatar
                      src={room.owner.photoURL || ""}
                      name={room.owner.username}
                      width="20px"
                      height="20px"
                      w={20}
                      h={20}
                      alt="profile photo"
                    />
                  )}
                  <Text color={"whiteAlpha.500"}>
                    {/* {isMine ? "Me" : room.owner && room.owner.username} */}
                    {room.owner && room.owner.username}
                  </Text>
                </HStack>
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

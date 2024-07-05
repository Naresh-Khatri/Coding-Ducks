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
import FAIcon from "_components/FAIcon";
import { faGlobe, faLock } from "@fortawesome/free-solid-svg-icons";
import { getTimeAgo } from "lib/formatDate";
import UserAvatar from "_components/utils/UserAvatar";
import { AddIcon, CloseIcon, DeleteIcon } from "@chakra-ui/icons";
import CreateDuckletModal from "_components/ducklets/CreateDuckletModal";
import Image from "next/image";

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
          <Text
            mt={5}
            fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
            fontWeight={"bold"}
          >
            My ducklets
          </Text>
          {/* <Button
            mt={5}
            leftIcon={<AddIcon />}
            size={"sm"}
            variant={"outline"}
            ml={5}
            colorScheme="purple"
            onClick={onOpen}
          >
            <Text fontSize={"small"}>New</Text>
          </Button> */}
        </HStack>
        <Divider mb={5} />
        {userLoaded && !user ? (
          <Text>Log in to view your ducklets</Text>
        ) : myRoomsLoading ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton w={"100%"} h={"200px"} key={i} borderRadius={"5px"} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
            <CreateRoomCard onOpen={onOpen} />
            {myRooms?.map((room) => (
              <RoomCard
                room={room}
                key={room.id}
                refetch={refetchMyRooms}
                isMine
              />
            ))}
          </SimpleGrid>
        )}
        <Text
          mt={"4rem"}
          fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
          fontWeight={"bold"}
        >
          My ducklets Other user&apos;s ducklets
        </Text>
        <Divider mb={5} />
        {otherRoomsLoading ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
            {Array.from({ length: 11 }).map((_, i) => (
              <Skeleton w={"100%"} h={"200px"} key={i} borderRadius={"5px"} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
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
        _hover={{ border: "2px dashed #9d4edd", transition: "border .2s" }}
        border={"2px dashed #ffffff29"}
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
  const { mutate, isLoading: isDeleteingRoom } = useRemoveRoom();
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
    <SlideFade
      in={true}
      offsetY="20px"
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* CHANGE IT WITH NEXT LINK LATER */}
      {isMine && isHovering && (
        <IconButton
          style={{ position: "absolute", right: "-8px", top: "-8px" }}
          aria-label="delete ducklet"
          onClick={onOpen}
          colorScheme="red"
          icon={<DeleteIcon />}
          size={"sm"}
          zIndex={99}
        />
      )}
      <a href={`/ducklets/${room.id}`}>
        <Card
          direction={{ base: "column", sm: "row" }}
          variant="outline"
          _hover={{
            border: "2px solid #9d4edd",
            transition: "border .2s",
            transform: "scale(1.02) rotate(-.5deg)",
            translateY: "5px",
          }}
          transition={'transform 0.2s ease'}
          position={"relative"}
        >
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
                  <Button
                    colorScheme="red"
                    mr={3}
                    onClick={handleDuckletRemove}
                    isLoading={isDeleteingRoom}
                  >
                    Delete
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
          <Stack w={"full"}>
            <CardBody p={0}>
              <Image
                src={room.previewImage || ""}
                alt="room preview"
                width={200}
                height={200}
                style={{
                  width: "300px",
                  height: "auto",
                  aspectRatio: "16/9",
                  borderRadius: "3px",
                }}
              />
            </CardBody>

            <CardFooter w={"full"} pt={0}>
              <VStack w={"full"}>
                <HStack
                  justifyContent={"space-between"}
                  align={"start"}
                  w="100%"
                >
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
                  {/* <LangIcon lang={room.lang} height="2rem" /> */}
                  {/* <CodePreview code={room.content} lang={room.lang} /> */}
                </HStack>
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
                  {/* <a href={`/ducklets/${room.id}`}>
                <Button variant="solid" colorScheme="purple" size={"sm"}>
                  Open
                </Button>
              </a> */}
                </HStack>
              </VStack>
            </CardFooter>
          </Stack>
        </Card>
      </a>
    </SlideFade>
  );
};

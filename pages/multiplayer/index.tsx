import { useContext, useEffect, useState } from "react";
import {
  Button,
  Center,
  Container,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";

import NormalLayout from "../../layout/NormalLayout";
import { userContext } from "../../contexts/userContext";
import { AddIcon } from "@chakra-ui/icons";
import SetMeta from "../../components/SEO/SetMeta";
import { websocketContext } from "../../contexts/websocketContext";
import RoomCard from "../../components/multiplayer/RoomCard";
import { useRoomsData } from "../../hooks/useRoomsData";

function MultiplayerPage() {
  const { user } = useContext(userContext);
  const { data: roomsList, isLoading, error } = useRoomsData();
  const {
    // roomsList,
    connectedClients,
    socket,
    isCreatingRoom,
    setIsCreatingRoom,
  } = useContext(websocketContext);
  const [roomname, setRoomname] = useState("");

  // check params for room name
  const createRoom = async () => {
    if (!user.id) return;
    setIsCreatingRoom(true);
    const newRoom = {
      roomname: roomname,
      user: {
        id: user.id,
        username: user.username,
      },
    };
    socket.emit("create-room", newRoom);
  };

  return (
    <NormalLayout>
      <SetMeta
        title="Coding Ducks - Collaborative Real-Time Coding with Friends"
        description="Code collaboratively in real-time with your friends on Coding Ducks. Engage in multiplayer coding challenges, work together on problem-solving, and strengthen your coding skills as a team."
        keywords="multiplayer coding challenges, collaborative coding, real-time coding, coding with friends, teamwork, problem-solving, programming collaboration"
        url="https://codingducks.live/multiplayer"
      />
      <Container maxW={{ base: "100vw", md: "90vw" }} minH={"100vh"}>
        {false ? (
          <Center w={"full"} h={"full"}>
            <HStack>
              <Spinner /> <Text>Connecting to WebSocket server...</Text>
            </HStack>
          </Center>
        ) : (
          <>
            <HStack justifyContent={"center"} alignItems={"center"} mt={20}>
              <Input
                value={roomname}
                placeholder="Enter room name"
                w={"50%"}
                onChange={(e) => setRoomname(e.target.value)}
              />
              <HStack>
                <Button
                  colorScheme="green"
                  isLoading={isCreatingRoom}
                  p={"1rem 2rem"}
                  leftIcon={<AddIcon />}
                  onClick={createRoom}
                >
                  Create
                </Button>
                <Button colorScheme="blue" p={"1rem 2rem"} isDisabled>
                  {/* TODO: complete join room logic */}u Join
                </Button>
              </HStack>
            </HStack>

            {isLoading ? (
              <Spinner />
            ) : error ? (
              <p>somethings went wrong</p>
            ) : (
              <>
                <Text>Available rooms:{roomsList.length}</Text>
                <Text>connected Clinets: {connectedClients.length}</Text>
                <SimpleGrid gap={10} columns={{ base: 2, sm: 3, lg: 4 }}>
                  {roomsList.map((room, i) => (
                    <RoomCard room={room} key={room.name} />
                  ))}
                </SimpleGrid>
              </>
            )}
          </>
        )}
      </Container>
    </NormalLayout>
  );
}

export default MultiplayerPage;

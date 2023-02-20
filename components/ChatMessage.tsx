import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { User } from "../hooks/useSubmissionsData";

interface message {
  userId: number;
  username: string;
  text: string;
  time?: string;
  roomId: string;
  photoURL: string;
}
interface ChatCompProps {
  socket: Socket;
  user: any;
  roomInfo: any;
  msgsList: message[];
}
const ChatMessage = ({ socket, roomInfo, user, msgsList }: ChatCompProps) => {
  const [show, setShow] = useState(true);
  const [text, setText] = useState("");
  const sendMsg = () => {
    const newMsg: message = {
      username: user.username,
      userId: user.id,
      roomId: roomInfo.id,
      text: text,
      photoURL: user.photoURL,
    };
    socket.emit("message", { newMsg, roomInfo: { name: roomInfo.name } });
    setText("");
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <>
      {show ? (
        <Container mt={10} maxW={"sm"}>
          {roomInfo && <RoomInfo roomInfo={roomInfo} />}
          <HStack>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMsg();
              }}
            />
            <Button onClick={sendMsg} colorScheme="green">Send</Button>
          </HStack>
          <VStack maxH={"700px"} overflow={"auto"}>
            {msgsList &&
              msgsList.map((msg, i) => {
                return (
                  <HStack
                    mt={5}
                    key={i}
                    bg={user.id == msg.userId ? "green.700" : "gray.700"}
                    borderRadius={"10px"}
                    w={"100%"}
                    justifyContent={"space-between"}
                    p={"1rem 2rem"}
                  >
                    <HStack as="span">
                      <Image
                        src={msg.photoURL}
                        alt="profile photo"
                        style={{ borderRadius: "50%" }}
                        width={50}
                        height={50}
                      />
                      <Text fontWeight={"extrabold"}>{msg.username}:</Text>
                      <Text>{msg.text}</Text>
                    </HStack>
                    <Text color={"gray.500"}>{formatTime(msg.time)}</Text>
                  </HStack>
                );
              })}
          </VStack>
        </Container>
      ) : (
        <Button onClick={() => setShow(true)}>Show chat</Button>
      )}
    </>
  );
};

interface roomInfo {
  id: number;
  name: string;
  isPublic: boolean;
  owner: User;
  ownerId: number;
  created_at: string;
}

const RoomInfo = ({ roomInfo }: { roomInfo: roomInfo }) => {
  return (
    <Box>
      <HStack justifyContent={"space-between"}>
        <Box>
          <Text fontSize={"xl"}>Room name: {roomInfo.name}</Text>
          <Text fontSize={"xl"}>Room id: {roomInfo.id}</Text>
        </Box>
        <HStack>
          <Image
            src={roomInfo.owner.photoURL}
            alt="room creater photo"
            width={50}
            height={50}
          />
          <Box>
            <Text>Room creater: {roomInfo.owner.fullname}</Text>
            <Text>@{roomInfo.owner.username}</Text>
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
};

export default ChatMessage;

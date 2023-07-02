import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { User } from "../hooks/useSubmissionsData";
import { CopyIcon, Icon, InfoIcon } from "@chakra-ui/icons";

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
    return `${date.getHours() > 9 ? date.getHours() : "0" + date.getHours()}:${
      date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes()
    }`;
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
              placeholder="Type your message here"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMsg();
              }}
            />
            <Button onClick={sendMsg} colorScheme="green">
              Send
            </Button>
          </HStack>
          <VStack maxH={"700px"} overflow={"auto"} mt={5}>
            {msgsList &&
              msgsList.map((msg, i) => {
                return (
                  <HStack
                    key={i}
                    bg={user.id == msg.userId ? "green.700" : "gray.700"}
                    borderRadius={
                      user.id == msg.userId
                        ? "20px 20px 0px 20px"
                        : "20px 20px 20px 0px"
                    }
                    minW={"300px"}
                    p={"1rem"}
                    mr={user.id === msg.userId ? "10px" : "auto"}
                    ml={user.id !== msg.userId ? "10px" : "auto"}
                    justifyContent={"space-between"}
                  >
                    <HStack as="span" w={"100%"} align={"start"}>
                      <Image
                        src={msg.photoURL}
                        alt="profile photo"
                        style={{ borderRadius: "50%" }}
                        width={40}
                        height={40}
                      />
                      <VStack w={"100%"} align={"start"}>
                        <HStack justifyContent={"space-between"} w={"100%"}>
                          <Text fontWeight={"extrabold"}>{msg.username}:</Text>
                          <Text color={"gray.500"}>{formatTime(msg.time)}</Text>
                        </HStack>
                        <Text>{msg.text}</Text>
                      </VStack>
                    </HStack>
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
    <HStack my={2} justifyContent={"space-between"}>
      <Box>
        <Box>
          <Text as="span">Room name:</Text>{" "}
          <Text as="span" fontWeight={"bold"}>
            {roomInfo.name}
          </Text>
        </Box>
        <Box>
          <Text as="span">Room id:</Text>{" "}
          <Text as="span" fontWeight={"bold"}>
            {roomInfo.id}
          </Text>
        </Box>
      </Box>
      <HStack>
        <Tooltip label="Copy room link">
          <IconButton aria-label="copy room link" icon={<CopyIcon />} />
        </Tooltip>
        <Popover>
          <PopoverTrigger>
            <IconButton aria-label="room info" icon={<InfoIcon />} />
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Room Info</PopoverHeader>
            <PopoverBody>
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
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
    </HStack>
  );
};

export default ChatMessage;

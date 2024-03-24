import {
  Badge,
  Box,
  Button,
  Center,
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
import { CopyIcon, Icon, InfoIcon } from "@chakra-ui/icons";
import { IChatMessage, IUser } from "../types";
import { MESSAGE_SEND } from "../lib/socketio/socketEvents";
import { IMessage, MessageSend } from "../lib/socketio/socketEventTypes";

interface ChatCompProps {
  socket: Socket;
  user: any;
  roomInfo: any;
  msgsList: IMessage[];
}
const ChatMessages = ({ socket, roomInfo, user, msgsList }: ChatCompProps) => {
  const [show, setShow] = useState(true);
  const [text, setText] = useState("");
  const sendMsg = () => {
    if (text.trim().length === 0) return;
    const newMsg = { user, room: roomInfo, text } as IMessage;
    socket.emit(MESSAGE_SEND, {
      msg: newMsg,
      room: { id: roomInfo.id },
    } as MessageSend);
    setText("");
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return `${date.getHours() > 9 ? date.getHours() : "0" + date.getHours()}:${
      date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes()
    }`;
  };
  const self = (msgId: number): boolean => {
    return msgId === user.id;
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
          <VStack maxH={"700px"} overflow={"auto"} mt={5} pt={5}>
            {msgsList &&
              msgsList.map((msg, i) => {
                return (
                  <>
                    {/* group by dates */}
                    {(i === 0 ||
                      msgsList[i].time.toString().split("T")[0] !==
                        msgsList[i - 1].time.toString().split("T")[0]) && (
                      <Center position={"sticky"} top={0} zIndex={99}>
                        <Badge
                          fontSize={"md"}
                          bg={"green"}
                          // colorScheme="purple"
                          borderRadius={"10px"}
                        >
                          {msg.time.toString().split("T")[0]}
                        </Badge>
                      </Center>
                    )}
                    <Flex
                      direction={`row${self(msg.user.id) ? "-reverse" : ""}`}
                      minW={"290px"}
                      position={"relative"}
                    >
                      <Image
                        src={msg.user.photoURL}
                        alt="profile photo"
                        style={{
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          position: "absolute",
                          top: "-1rem",
                        }}
                        width={40}
                        height={40}
                      />
                      <Box
                        ml={!self(msg.user.id) ? "3.2rem" : "0"}
                        mr={self(msg.user.id) ? "3.2rem" : "0"}
                      >
                        {!self(msg.user.id) && (
                          <Text fontWeight={"extrabold"} w={"fit-content"}>
                            {msg.user.username}:
                          </Text>
                        )}
                        <Flex
                          key={i}
                          bg={self(msg.user.id) ? "green.700" : "gray.700"}
                          borderRadius={"10px"}
                          minW={"120px"}
                          w={"fit-content"}
                          p={"1rem"}
                          direction={`row${
                            self(msg.user.id) ? "-reverse" : ""
                          }`}
                        >
                          <Text>{msg.text}</Text>
                        </Flex>
                      </Box>
                      <Text
                        alignSelf={"center"}
                        mr={self(msg.user.id) ? ".5rem" : "0"}
                        ml={!self(msg.user.id) ? ".5rem" : "0"}
                        color={"gray.500"}
                      >
                        {formatTime(msg.time.toString())}
                      </Text>
                    </Flex>
                  </>
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
  owner: IUser;
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

export default ChatMessages;

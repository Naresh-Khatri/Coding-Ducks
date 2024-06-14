import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { MESSAGE_SEND } from "../lib/socketio/socketEvents";
import { IMessage } from "../lib/socketio/socketEventTypes";
import UserAvatar from "./utils/UserAvatar";

interface ChatCompProps {
  socket: Socket;
  user: any;
  roomInfo: any;
  msgsList: IMessage[];
}
const ChatMessages = ({ socket, roomInfo, user, msgsList }: ChatCompProps) => {
  const [text, setText] = useState("");
  const sendMsg = () => {
    if (text.trim().length === 0) return;
    socket.emit(MESSAGE_SEND, {
      text: text,
      user: { id: user.id, username: user.username, photoURL: user.photoURL },
      room: { id: roomInfo.id },
    } as IMessage);
    setText("");
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return `${date.getHours() > 9 ? date.getHours() : "0" + date.getHours()}:${
      date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes()
    }`;
  };
  const self = (msgUserId: number): boolean => {
    return msgUserId === user.id;
  };

  return (
    <>
      <HStack>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMsg();
          }}
        />
        <Button onClick={sendMsg} colorScheme="purple">
          Send
        </Button>
      </HStack>
      <VStack h={"calc(100% - 55px)"} overflowY={"auto"} mt={5} pt={5}>
        {msgsList &&
          msgsList.map((msg, i) => {
            // this is for timestamps
            if (
              i === 0 ||
              msgsList[i].time.toString().split("T")[0] !==
                msgsList[i - 1].time.toString().split("T")[0]
            )
              return (
                <Box key={i} w={'100%'}>
                  <Center position={"sticky"} top={0} zIndex={99} mb={2}>
                    <Badge
                      fontSize={"md"}
                      px={2}
                      colorScheme="purple"
                      borderRadius={"7px"}
                    >
                      {msg.time.toString().split("T")[0]}
                    </Badge>
                  </Center>
                  <Flex
                    style={{
                      display: "flex",
                      minWidth: "100%",
                      position: "relative",
                      flexDirection: `row${
                        self(msg.user.id) ? "-reverse" : ""
                      }`,
                    }}
                  >
                    <UserAvatar
                      src={msg.user.photoURL}
                      name={msg.user.username}
                      alt="profile photo"
                      style={{
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        position: "absolute",
                      }}
                      w={40}
                      h={40}
                    />
                    <Box
                      ml={!self(msg.user.id) ? "3.2rem" : "0"}
                      mr={self(msg.user.id) ? "3.2rem" : "0"}
                      position={"relative"}
                    >
                      {!self(msg.user.id) && (
                        <Text fontWeight={"extrabold"} w={"fit-content"}>
                          {msg.user.username}
                        </Text>
                      )}
                      <Flex
                        key={i}
                        bg={self(msg.user.id) ? "purple.700" : "gray.600"}
                        borderRadius={"10px"}
                        minW={"120px"}
                        w={"fit-content"}
                        p={"1rem"}
                      >
                        <Text>{msg.text}</Text>
                      </Flex>
                      <Text
                        position={"absolute"}
                        zIndex={99}
                        alignSelf={"end"}
                        right={2}
                        bottom={0}
                        color={"gray.500"}
                      >
                        {formatTime(msg.time.toString())}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              );
            return (
              <Flex
                key={i}
                style={{
                  display: "flex",
                  minWidth: "100%",
                  position: "relative",
                  flexDirection: `row${self(msg.user.id) ? "-reverse" : ""}`,
                }}
              >
                <UserAvatar
                  src={msg.user.photoURL}
                  name={msg.user.username}
                  alt="profile photo"
                  style={{
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    position: "absolute",
                  }}
                  w={40}
                  h={40}
                />
                <Box
                  ml={!self(msg.user.id) ? "3.2rem" : "0"}
                  mr={self(msg.user.id) ? "3.2rem" : "0"}
                  position={"relative"}
                >
                  {!self(msg.user.id) && (
                    <Text fontWeight={"extrabold"} w={"fit-content"}>
                      {msg.user.username}
                    </Text>
                  )}
                  <Flex
                    key={i}
                    bg={self(msg.user.id) ? "purple.700" : "gray.600"}
                    borderRadius={"10px"}
                    minW={"120px"}
                    w={"fit-content"}
                    p={"1rem"}
                  >
                    <Text>{msg.text}</Text>
                  </Flex>
                  <Text
                    position={"absolute"}
                    zIndex={99}
                    alignSelf={"end"}
                    right={2}
                    bottom={0}
                    color={"gray.500"}
                  >
                    {formatTime(msg.time.toString())}
                  </Text>
                </Box>
              </Flex>
            );
          })}
      </VStack>
    </>
  );
};

export default ChatMessages;

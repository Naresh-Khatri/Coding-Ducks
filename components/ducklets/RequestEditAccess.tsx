"use client";
import { EditIcon } from "@chakra-ui/icons";
import { Button, Spinner, Text, useToast } from "@chakra-ui/react";
import { userContext } from "contexts/userContext";
import { ISocketRoom, USER_JOIN_REQUEST } from "lib/socketio/socketEvents";
import Link from "next/link";
import React, { use, useState } from "react";
import useGlobalStore from "stores";

function RequestEditAccess({ currRoom }: { currRoom: ISocketRoom }) {
  const socket = useGlobalStore((state) => state.socket);
  const { user, userLoaded } = use(userContext);
  const [waitingForJoinRequest, setWatingForJoinRequest] = useState(false);

  const toast = useToast();
  const handleRequestAccess = async () => {
    if (!socket || !user) return;
    setWatingForJoinRequest(true);
    setTimeout(() => {
      setWatingForJoinRequest(false);
      toast({
        title: "Request not accepted",
        description: "The owner has not accepted your request",
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }, 5000);
    socket.emit(
      USER_JOIN_REQUEST,
      { roomId: currRoom?.id, userId: user.id },
      (res) => {
        console.log(res);
      }
    );
  };
  if (!userLoaded) return <Spinner />;
  if (!user)
    return (
      <Link href={`/login?from=ducklets/${currRoom.id}`}>
        <Button colorScheme="purple" size={"sm"}>
          <Text lineHeight={0.7}>Sign Up</Text>
        </Button>
      </Link>
    );
  return (
    <Button
      leftIcon={<EditIcon />}
      isLoading={waitingForJoinRequest}
      onClick={handleRequestAccess}
    >
      Request Access
    </Button>
  );
}

export default RequestEditAccess;

import {
  Flex,
  HStack,
  Text,
  CircularProgress as ChakraCircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";

import UserAvatar from "_components/utils/UserAvatar";
import { getTimeAgo } from "lib/formatDate";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function UISubmissionCard({
  attempt,
  url,
  isSelf,
}: {
  attempt: any;
  url: string,
  isSelf?: boolean;
}) {
  return (
    <Flex direction={"column"} key={attempt.id}>
      <Link href={url}>
        <Image
          src={attempt.imgCode}
          alt="attempt screenshot"
          width={500}
          height={400}
          style={{ width: "100%", borderRadius: "10px" }}
        />
      </Link>
      <HStack w={"full"} justifyContent={"space-between"}>
        <HStack>
          <UserAvatar
            src={attempt.user.photoURL}
            alt="user avatar"
            h={40}
            w={40}
          />
          <Flex flexDirection={"column"} alignItems={"start"}>
            <HStack>
              <Link href={`/users/${attempt.user.username}`} target="_blank">
                <Text
                  fontWeight={"bold"}
                  _hover={{
                    textDecoration: "underline",
                  }}
                >
                  {attempt.user.username}
                </Text>
              </Link>
              {isSelf && <Text color={"green.500"}>(You)</Text>}
            </HStack>
            <Text color={"gray.500"}>{getTimeAgo(attempt.createdAt)}</Text>
          </Flex>
        </HStack>
        <ChakraCircularProgress value={attempt.score / 10} color="green.400">
          <CircularProgressLabel>
            {Math.round(attempt.score / 10)}%
          </CircularProgressLabel>
        </ChakraCircularProgress>
      </HStack>
    </Flex>
  );
}

export default UISubmissionCard;

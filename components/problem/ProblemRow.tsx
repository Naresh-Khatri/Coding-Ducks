import React from "react";
import { IProblem } from "../../types";
import {
  Avatar,
  AvatarGroup,
  Box,
  Center,
  Flex,
  Td,
  Text,
  Tr,
  useToast,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { DIFFICULTY_TO_COLOR } from "../../data/problems";
import FAIcon from "../FAIcon";

interface ProblemRowProps {
  isLocked: boolean;
  problem: IProblem;
  index: number;
}
function ProblemRow({ isLocked, problem }: ProblemRowProps) {
  const toast = useToast();
  return (
    <>
      {isLocked && (
        <Tr
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          pos={"absolute"}
          w={"100%"}
          h={"52px"}
          bg={"rgba(0,0,0,0.5)"}
          zIndex={10}
          backdropFilter="auto"
          backdropBlur="2px"
          onClick={() => {
            toast({
              title: "Locked",
              description: "Solve above questions to unlock",
              status: "error",
              duration: 9000,
              isClosable: true,
            });
          }}
        >
          <Td m={0} p={0}>
            <Flex alignItems={"center"} background={"gray.900"}>
              <FAIcon icon={faLock} />
              <Text ml={4} fontWeight={"bold"}>
                Solve above questions to unlock
              </Text>
            </Flex>
          </Td>
        </Tr>
      )}
      <Tr key={problem.id} onClick={() => console.log("clicked")}>
        <Td px={{ base: 3, md: 3 }} h={"50px"}>
          <Center>
            {isLocked ? null : problem.status === "tried" ? (
              "A"
            ) : problem.status === "solved" ? (
              <CheckIcon color="green.500" />
            ) : null}
          </Center>
        </Td>
        <Td px={{ base: 1, md: 3 }}>
          <Link href={`/problems/${problem.slug}`}>
            <ChakraLink>
              {problem.frontendProblemId}. {problem.title}
            </ChakraLink>
          </Link>
        </Td>
        {/* <Td px={{ base: 1, md: 3 }}>{problem.accuracy || "-"}</Td> */}
        <Td px={{ base: 1, md: 3 }}>
          <Text
            fontWeight={"bold"}
            color={DIFFICULTY_TO_COLOR[problem.difficulty].color}
          >
            {DIFFICULTY_TO_COLOR[problem.difficulty].label}
          </Text>
        </Td>
        <Td m={0} p={0} pl={5} px={{ base: 1, md: 3 }}>
          <AvatarGroup size="md" max={2} h={"50px"}>
            {problem.submissions.map((submission, idx) => (
              <Avatar
                key={idx}
                size={"md"}
                name={submission.User.fullname}
                src={submission.User.photoURL}
                onClick={() =>
                  (window.location.href = `/users/${submission.User.username}`)
                }
                cursor={"pointer"}
              />
            ))}
          </AvatarGroup>
        </Td>
      </Tr>
    </>
  );
}

export default ProblemRow;

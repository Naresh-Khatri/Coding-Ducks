import React from "react";
import { IProblem } from "../../types";
import {
  Avatar,
  AvatarGroup,
  Box,
  Center,
  Td,
  Text,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { DIFFICULTY_TO_COLOR } from "../../data/problems";

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
          <FontAwesomeIcon icon={faLock as IconProp} />
          <Text ml={4} fontWeight={"bold"}>
            Solve above questions to unlock
          </Text>
        </Tr>
      )}
      <Tr
        key={problem.id}
        style={
          {
            //   opacity: isLocked ? 0.3 : 1,
            //   border: isLocked ? "2px solid #333" : "",
          }
        }
        onClick={() => console.log("clicked")}
      >
        <Td h={"50px"}>
          {isLocked ? null : problem.status === "tried" ? (
            "A"
          ) : problem.status === "solved" ? (
            <CheckIcon color="green.500" />
          ) : null}
        </Td>
        <Td>
          <Link href={`/problems/${problem.slug}`}>
            <Text>
              {problem.frontendProblemId}. {problem.title}
            </Text>
          </Link>
        </Td>
        <Td>{problem.accuracy || "-"}</Td>
        <Td>
          <Text
            fontWeight={"bold"}
            color={DIFFICULTY_TO_COLOR[problem.difficulty].color}
          >
            {problem.difficulty}
          </Text>
        </Td>
        <Td m={0} p={0} pl={5}>
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

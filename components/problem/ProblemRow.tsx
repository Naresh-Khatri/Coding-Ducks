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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { DIFFICULTY_TO_COLOR } from "../../data/problems";
import FAIcon from "../FAIcon";
import { useProblemSolvedByData } from "../../hooks/useProblemsData";
import { UserList } from "../FollowDetailsModal";
import { formatDate } from "../../lib/formatDate";

interface ProblemRowProps {
  isLocked: boolean;
  problem: IProblem;
  index: number;
}
function ProblemRow({ isLocked, problem }: ProblemRowProps) {
  const {
    isOpen: isShowSolvedByOpen,
    onOpen: onShowSolvedByOpen,
    onClose: onShowSolvedByClose,
  } = useDisclosure();
  const {
    data: solvedByUsers,
    isLoading,
    error,
  } = useProblemSolvedByData(problem.id, isShowSolvedByOpen);
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
      <Tr key={problem.id}>
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
          <ChakraLink as={Link} href={`/problems/${problem.slug}`}>
            {problem.frontendProblemId}. {problem.title}
          </ChakraLink>
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
            {problem.submissions &&
              problem.submissions.map((submission, idx) => (
                <Avatar
                  key={idx}
                  size={"md"}
                  name={submission.User.fullname}
                  src={submission.User.photoURL}
                  onClick={onShowSolvedByOpen}
                  // onClick={() =>
                  //   (window.location.href = `/users/${submission.User.username}`)
                  // }
                  cursor={"pointer"}
                />
              ))}
          </AvatarGroup>
          <Modal isOpen={isShowSolvedByOpen} onClose={onShowSolvedByClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Solved By</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {isLoading ? (
                  <Spinner />
                ) : (
                  solvedByUsers &&
                  solvedByUsers.map((user) => (
                    <UserList
                      key={user.id}
                      user={user}
                      caption={formatDate(user.solvedAt)}
                      onClose={onShowSolvedByClose}
                    />
                  ))
                )}
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onShowSolvedByClose}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Td>
      </Tr>
    </>
  );
}

export default ProblemRow;

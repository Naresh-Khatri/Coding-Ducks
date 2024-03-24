import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { IUser } from "../../types";
import { useSubmissionData } from "../../hooks/useSubmissionsData";
import Image from "next/image";
import { formatDate, formatTime } from "../../lib/formatDate";
import { errorType2Label, lang2Label, langToAceModes } from "../../lib/utils";
import dynamic from "next/dynamic";
import { ChevronRightIcon } from "@chakra-ui/icons";
import Link from "next/link";

const AceEditor = dynamic(() => import("react-ace"), { ssr: false });

interface ViewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
}
function ViewSubmissionModal({
  isOpen,
  onClose,
  submissionId,
}: ViewSubmissionModalProps) {
  const { data, isLoading, error } = useSubmissionData(submissionId, isOpen);
  const submissionData = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"4xl"}>
      <ModalOverlay />
      <ModalContent mx={2}>
        <ModalHeader>Submission Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* {error && <Box> {(data && data.status) || ""} </Box>} */}
          {isLoading || !submissionData ? (
            <>
              <Stack spacing={5}>
                <HStack alignItems={"start"}>
                  <SkeletonCircle size="16" />
                  <SkeletonText
                    mt="4"
                    w={"30%"}
                    noOfLines={2}
                    spacing="4"
                    skeletonHeight="2"
                  />
                </HStack>
                <Skeleton borderRadius={10} height="200px" />
              </Stack>
            </>
          ) : (
            <>
              <HStack justifyContent={"space-between"}>
                <Profile
                  user={submissionData.User}
                  timestamp={submissionData.timestamp}
                />
                <Stack direction={{ base: "column", md: "row" }}>
                  <Badge
                    colorScheme={submissionData.isAccepted ? "green" : "red"}
                    p={1}
                    px={2}
                    mr={{ base: 0, md: 10 }}
                    borderRadius={15}
                  >
                    {submissionData.isAccepted ? "Accepted" : "Rejected"}
                  </Badge>
                  <Badge
                    colorScheme={"blue"}
                    p={1}
                    px={2}
                    mr={{ base: 0, md: 10 }}
                    borderRadius={15}
                    textAlign={"center"}
                  >
                    {lang2Label[submissionData.lang]}
                  </Badge>
                </Stack>
              </HStack>
              <Flex justifyContent={"center"} mt={"2rem"}>
                <AceEditor
                  mode={langToAceModes[submissionData.lang]}
                  readOnly
                  onLoad={(editor) => {
                    editor.renderer.setPadding(20);
                    editor.setFontSize(16);
                  }}
                  style={{ borderRadius: "10px" }}
                  width="100%"
                  height="20rem"
                  focus={false}
                  theme="dracula"
                  name="blah2"
                  showGutter={false}
                  fontSize={14}
                  value={submissionData.code}
                />
              </Flex>
              <Flex>
                {submissionData.tests?.some((r) => r.errorOccurred) && (
                  <Box w={"100%"} mt={5}>
                    <HStack justifyContent={"space-between"}>
                      <Text
                        color={"red.400"}
                        fontWeight="extrabold"
                        fontSize={"xl"}
                      >
                        {
                          errorType2Label[
                            submissionData.tests[0].errorType || "run-time"
                          ]
                        }
                      </Text>
                    </HStack>
                    <Box py={2}>
                      <Text>Details: </Text>
                      <Box bg={"#f1635f22"} p={3} borderRadius={10}>
                        <Text
                          as="pre"
                          w={"100%"}
                          color={"red.400"}
                          dangerouslySetInnerHTML={{
                            __html: (
                              submissionData?.tests[0].errorMessage || ""
                            )
                              .split("\n")
                              .slice(1)
                              .join("\n"),
                          }}
                        ></Text>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Flex>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="purple"
            mr={3}
            variant={"ghost"}
            onClick={onClose}
          >
            Close
          </Button>
          {!isLoading &&
            submissionData?.isAccepted &&
            submissionData?.nextProblem && (
              <a href={`/problems/${submissionData.nextProblem.slug}`}>
                <Button
                  colorScheme="purple"
                  mr={3}
                  rightIcon={<ChevronRightIcon />}
                  onClick={onClose}
                >
                  Next Problem
                </Button>
              </a>
            )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const Profile = ({ user, timestamp }: { user: IUser; timestamp: string }) => {
  if (!user) return <Box>loading...</Box>;
  return (
    <Flex justifyContent={"space-between"}>
      <Flex>
        <Image
          src={user.photoURL}
          alt={user.fullname || "user"}
          width={50}
          height={50}
          style={{ width: "50px", height: "50px", borderRadius: "50%" }}
        />
        <Flex ml={4} direction={"column"}>
          <Flex alignItems={"center"}>
            <Text fontWeight={"bold"}>{user.fullname}</Text>
            <Text ml={2} fontSize={"sm"} color={"whiteAlpha.700"}>
              @{user.username}
            </Text>
          </Flex>
          <Box>
            <Text fontSize={"xs"} color={"whiteAlpha.700"}>
              {formatDate(timestamp) + " " + formatTime(timestamp)}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Flex></Flex>
    </Flex>
  );
};

export default ViewSubmissionModal;

import {
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
  CircularProgress as ChakraCircularProgress,
  CircularProgressLabel,
  useToast,
  FormControl,
  FormLabel,
  Switch,
  ModalOverlay,
} from "@chakra-ui/react";
import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { IUIChallengeAttempt } from "types";
import ImageDiff from "./ImageDiff";

import Confetti from "react-confetti";
import PositionConfetti from "canvas-confetti";
import Image from "next/image";
import { InfoIcon } from "@chakra-ui/icons";
import { useChallengeAttemptsData } from "hooks/useChallengesData";
import UserAvatar from "components/utils/UserAvatar";
import { getTimeAgo } from "lib/formatDate";
import { userContext } from "contexts/userContext";
import Link from "next/link";
import animatedDucks from "constants/animated-ducks";
import FAIcon from "components/FAIcon";
import { faLinkedin, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useRouter } from "next/navigation";
import { generateLinkedInPostText } from "lib/utils";

const SubmissionModal = ({
  onClose,
  isOpen,
  isLoading,
  isMobile,
  result,
}: {
  onClose: () => void;
  isOpen: boolean;
  isLoading: boolean;
  isMobile: boolean;
  result: IUIChallengeAttempt;
}) => {
  const { user } = use(userContext);
  const { data: attemptsData, isLoading: attemptsLoading } =
    useChallengeAttemptsData(result?.challengeId);
  const [tabIndex, setTabIndex] = useState(0);
  const [showRectangles, setShowRectangles] = useState(true);

  useEffect(() => {
    if (!result) return;
    if (result && result.score >= 900) {
      PositionConfetti({
        particleCount: 300,
        spread: 270,
        gravity: 0.5,
        shapes: ["circle", "circle", "square"],
        zIndex: 2000,
        origin: {
          x: 0.5,
          y: 0.2,
        },
      });
    }
  }, [isLoading]);
  return (
    <>
      {!isLoading && result.score >= 900 && <Confetti />}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={"xl"}
        closeOnEsc={false}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent minW={isMobile ? "" : "900px"}>
          {/* <ModalHeader>Submission Details</ModalHeader> */}
          {!isLoading && <ModalCloseButton />}
          <ModalBody minH={"400px"} h={"400px"} mt={10}>
            {isLoading ? (
              <Flex
                justifyContent={"center"}
                alignItems={"center"}
                mt={"10rem"}
                h={"full"}
                w={"full"}
              >
                <HStack>
                  <Spinner />
                  <Text> Performing various checks on your code</Text>
                </HStack>
              </Flex>
            ) : (
              <>
                <VStack gap={4} px={{ base: 0, md: 10 }}>
                  <ScoreCard
                    result={result}
                    // score={result.score / 10}
                    score={90}
                  />
                  <VStack
                    alignItems={"start"}
                    justifyContent={"start"}
                    w={"full"}
                  >
                    <Heading fontSize={"4xl"}>Screenshots</Heading>
                    <Tabs
                      flexDirection={"row"}
                      variant={"unstyled"}
                      justifyContent={"space-between"}
                      index={tabIndex}
                      onChange={(newIndex) => setTabIndex(newIndex)}
                      w={"full"}
                    >
                      <TabList
                        bg="gray.800"
                        w={"fit-content"}
                        borderRadius={"13px"}
                        p={1}
                        pos={"relative"}
                      >
                        <Flex
                          pos={"absolute"}
                          bg={"purple.600"}
                          w={"110px"}
                          h={"2.5rem"}
                          borderRadius={"10px"}
                          zIndex={0}
                          bottom={1}
                          left={1 + tabIndex * 110}
                          transition={"left .2s ease-out"}
                        ></Flex>
                        {["Compare", "Result", "Difference", "Masked"].map(
                          (tab) => (
                            <Tab
                              justifyContent={"center"}
                              key={tab}
                              fontWeight={"bold"}
                              zIndex={1}
                              w={"110px"}
                            >
                              {tab}
                            </Tab>
                          )
                        )}
                      </TabList>

                      {result.imgBefore &&
                        result.imgAfter &&
                        result.imgTarget &&
                        result.imgCode &&
                        result.imgDiff &&
                        result.ogImage &&
                        result.imgFilledAfter &&
                        result.imgMask && (
                          <>
                            <TabPanels>
                              <TabPanel p={0} py={2}>
                                <VStack>
                                  <Center w="full">
                                    {showRectangles ? (
                                      <ImageDiff
                                        sourceImage={result.imgAfter}
                                        targetImage={result.imgBefore}
                                      />
                                    ) : (
                                      <ImageDiff
                                        sourceImage={result.imgCode}
                                        targetImage={result.imgTarget}
                                      />
                                    )}
                                  </Center>
                                  <FormControl
                                    display="flex"
                                    alignItems="center"
                                  >
                                    <FormLabel
                                      htmlFor="email-alerts"
                                      mb="0"
                                      fontWeight={"bold"}
                                    >
                                      Show Rectangles?
                                    </FormLabel>
                                    <Switch
                                      id="email-alerts"
                                      defaultChecked={showRectangles}
                                      onChange={(e) =>
                                        setShowRectangles(e.target.checked)
                                      }
                                    />
                                  </FormControl>
                                </VStack>
                              </TabPanel>
                              <TabPanel
                                p={0}
                                py={2}
                                w="full"
                                justifyContent={"end"}
                              >
                                <Center w={"full"}>
                                  <Image
                                    src={result.ogImage}
                                    loading="lazy"
                                    width={500}
                                    height={400}
                                    alt="'diff"
                                    style={{ width: "100%" }}
                                  />
                                </Center>
                              </TabPanel>
                              <TabPanel
                                p={0}
                                py={2}
                                w="full"
                                justifyContent={"end"}
                              >
                                <Center w={"full"}>
                                  <Image
                                    loading="lazy"
                                    src={result.imgDiff}
                                    width={500}
                                    height={400}
                                    style={{ width: "100%" }}
                                    alt="'diff"
                                  />
                                </Center>
                              </TabPanel>
                              <TabPanel
                                p={0}
                                py={2}
                                w="full"
                                justifyContent={"end"}
                              >
                                <Center w={"full"}>
                                  <Image
                                    loading="lazy"
                                    src={result.imgMask}
                                    width={500}
                                    height={400}
                                    style={{ width: "100%" }}
                                    alt="'diff"
                                  />
                                </Center>
                              </TabPanel>
                            </TabPanels>
                          </>
                        )}
                    </Tabs>
                  </VStack>
                  <VStack
                    mt={10}
                    alignItems={"start"}
                    justifyContent={"start"}
                    w="full"
                  >
                    <Heading fontSize={"3xl"} mt={5} lineHeight={0.5}>
                      Detailed Feedback ( 🚧👷🏼‍♀️ )
                    </Heading>
                    <Text color={"gray.500"} w={"full"} my={3}>
                      feature coming soon!
                    </Text>
                  </VStack>
                  <VStack mt={10} alignItems={"start"} w="full">
                    <Heading fontSize={"3xl"} my={5} lineHeight={0.5}>
                      Leaderboard
                    </Heading>
                    {attemptsLoading ? (
                      <Spinner />
                    ) : (
                      <SimpleGrid
                        columns={{ base: 1, md: 2 }}
                        gap={10}
                        w={"full"}
                      >
                        {attemptsData &&
                          attemptsData.map((attempt) => (
                            <Flex direction={"column"} key={attempt.id}>
                              <Image
                                src={attempt.imgCode}
                                alt="attempt screenshot"
                                width={500}
                                height={400}
                                style={{ width: "100%", borderRadius: "10px" }}
                              />
                              <HStack
                                w={"full"}
                                justifyContent={"space-between"}
                              >
                                <HStack>
                                  <UserAvatar
                                    src={attempt.user.photoURL}
                                    alt="user avatar"
                                    h={40}
                                    w={40}
                                  />
                                  <Flex
                                    flexDirection={"column"}
                                    alignItems={"start"}
                                  >
                                    <HStack>
                                      <Link
                                        href={`/users/${attempt.user.username}`}
                                        target="_blank"
                                      >
                                        <Text
                                          fontWeight={"bold"}
                                          _hover={{
                                            textDecoration: "underline",
                                          }}
                                        >
                                          {attempt.user.username}
                                        </Text>
                                      </Link>
                                      {attempt.user.id === user?.id && (
                                        <Text color={"green.500"}>(You)</Text>
                                      )}
                                    </HStack>
                                    <Text color={"gray.500"}>
                                      {getTimeAgo(attempt.createdAt)}
                                    </Text>
                                  </Flex>
                                </HStack>
                                <ChakraCircularProgress
                                  value={attempt.score / 10}
                                  color="green.400"
                                >
                                  <CircularProgressLabel>
                                    {Math.round(attempt.score / 10)}%
                                  </CircularProgressLabel>
                                </ChakraCircularProgress>
                              </HStack>
                            </Flex>
                          ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </VStack>
              </>
            )}
          </ModalBody>

          {!isLoading && (
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
              {/* <Button variant="ghost">Secondary Action</Button> */}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default SubmissionModal;

const ScoreCard = ({
  score,
  result,
}: {
  score: number;
  result: IUIChallengeAttempt;
}) => {
  let color: string;
  let label: string;
  let bg: string;
  let duckSrc: string;
  if (score < 65) {
    color = "#F56565";
    bg = "#FEB2B2";
    label = "Not Quite";
    duckSrc = animatedDucks.slap.image;
  } else if (score < 80) {
    color = "#D69E2E";
    bg = "#F6E05E";
    label = "Almost There";
    duckSrc = animatedDucks.motivate.image;
  } else {
    color = "#48BB78";
    bg = "#9AE6B4";
    label = "Almost Perfect";
    duckSrc = animatedDucks.impressive.image;
  }
  if (score === 100) {
    label = "Perfect!";
    duckSrc = animatedDucks.bamboozled.image;
  }
  const toast = useToast();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    setTimeout(() => {
      toast({
        title: "Great Job! 🎉",
        description: "I'd really love if you post it on LinkedIn! 🥹🥹",
        position: "top",
        duration: 15000,
      });
    }, 1000);
  }, []);

  console.log(result);
  const linkedInShareUrl = useMemo(
    () =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${
        process.env.NODE_ENV === "production"
          ? window.location.href
          : "https://dev3000.codingducks.xyz/ui-challenges/hello-world" +
            "/attempts/" +
            result.id
      }&text=${generateLinkedInPostText({
        challengeName: result?.challenge?.title || "",
        score,
        url: `https://dev3000.codingducks.xyz/ui-challenges/hello-world/attemps/${result.id}`,
      })}`,
    [result.id]
  );

  return (
    <>
      <Heading alignSelf={"start"} fontSize={"3xl"}>
        Similarity Score
        <Tooltip label="This is an automated score based on SSIM algorithm">
          <InfoIcon ml={2} h={4} w={4} color={"gray.500"} />
        </Tooltip>
      </Heading>
      <SimpleGrid w={"full"} columns={3}>
        <VStack h="full" justifyContent={"start"}>
          <CircularProgress
            size={"150px"}
            value={score}
            bg={bg}
            color={color}
            label={label}
          />
        </VStack>
        <Center>
          <Image src={duckSrc} alt="duck" width={150} height={150} />
        </Center>
        <VStack justifyContent={"center"}>
          <Link href={linkedInShareUrl} target="_blank">
            <Button
              w={"200px"}
              leftIcon={<FAIcon icon={faLinkedin} display="none" />}
              colorScheme="messenger"
            >
              Share on LinkedIn
            </Button>
          </Link>
          <Button
            w={"200px"}
            leftIcon={<FAIcon icon={faWhatsapp} />}
            colorScheme="green"
          >
            Share on WhatsApp
          </Button>
        </VStack>
      </SimpleGrid>
    </>
  );
};
const CircularProgress = ({
  value,
  size,
  bg,
  color,
  label,
}: {
  value: number;
  size: string;
  color: string;
  bg: string;
  label: string;
}) => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    setTimeout(() => {
      setScore(value);
    }, 1000);
  }, []);
  // const Foo = () => (
  //   <Flex
  //     role="progressbar"
  //     aria-valuenow={value}
  //     aria-valuemin={0}
  //     aria-valuemax={100}
  //     p={3}
  //     width={size}
  //     height={size}
  //     borderRadius={"50%"}
  //     background={`
  //   conic-gradient(${color} ${value}%, transparent 0);
  // `}
  //   >
  //     <Flex
  //       w={"100%"}
  //       h={"100%"}
  //       borderRadius={"50%"}
  //       direction={"column"}
  //       justifyContent={"center"}
  //       alignItems={"center"}
  //       color={color}
  //       background={"#2d3748"}
  //       pos={"relative"}
  //     >
  //       <Flex>
  //         <Text
  //           fontWeight={"bold"}
  //           fontSize={"5xl"}
  //           textAlign={"center"}
  //           lineHeight={1}
  //         >
  //           {value}
  //         </Text>
  //         <Text
  //           fontWeight={"bold"}
  //           fontSize={"1xl"}
  //           textAlign={"center"}
  //           lineHeight={1.5}
  //         >
  //           %
  //         </Text>
  //       </Flex>
  //       <Text
  //         fontWeight={"bold"}
  //         fontSize={"1xl"}
  //         textAlign={"center"}
  //         lineHeight={1.5}
  //       >
  //         {label}
  //       </Text>
  //     </Flex>
  //   </Flex>
  // );
  return (
    <>
      <ChakraCircularProgress
        trackColor="transparent"
        value={score}
        color={color}
        size={"150px"}
        thickness={"0.625rem"}
      >
        <CircularProgressLabel
          display={"flex"}
          flexDir={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          color={color}
        >
          <Flex w={"fit-content"}>
            <Text fontWeight={"bold"} fontSize={"5xl"} lineHeight={1}>
              {score}
            </Text>
            <Text fontWeight={"bold"} fontSize={"md"} lineHeight={1.5}>
              %
            </Text>
          </Flex>
          <Text
            fontWeight={"bold"}
            fontSize={"0.85rem"}
            textAlign={"center"}
            lineHeight={1.5}
          >
            {label}
          </Text>
        </CircularProgressLabel>
      </ChakraCircularProgress>
    </>
  );
};

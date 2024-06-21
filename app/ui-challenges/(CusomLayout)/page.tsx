"use client";

import React, { use, useEffect, useState } from "react";
import { userContext } from "contexts/userContext";
import {
  Box,
  Card,
  CardBody,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  SlideFade,
  Stack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import Image from "next/image";
import { useChallengesData } from "hooks/useChallengesData";
import { IUIChallenge, UIChallengeDifficulty } from "types";
import { CHALLENGE_DIFFICULTIES } from "constants/index";
import Link from "next/link";

function UIChallengespage() {
  // const { user, userLoaded } = use(userContext);
  const {
    data: challenges,
    isLoading: challengesLoading,
    error: challengesError,
    refetch: refetchChallenge,
  } = useChallengesData();

  let filteredChallenges = challenges?.filter((c) => c.isPublic);

  return (
    <>
      <Container maxW={"container.xl"} minH={"80vh"}>
        <HStack>
          <Text
            mt={"3rem"}
            mb={"2rem"}
            fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
            fontWeight={"bold"}
          >
            UI Challenges
          </Text>
        </HStack>
        <Divider mb={5} />
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10}>
          {filteredChallenges?.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </SimpleGrid>
      </Container>
    </>
  );
}

export default UIChallengespage;

const ChallengeCard = ({ challenge }: { challenge: IUIChallenge }) => {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <SlideFade in={true} offsetY="20px">
      {/* CHANGE IT WITH NEXT LINK LATER */}
      <Link href={`/ui-challenges/${challenge.slug}/submissions`}>
        <Card
          direction={{ base: "column", sm: "row" }}
          variant="outline"
          _hover={{
            border: "1px solid #9d4edd",
            // transition: "all .2s",
            // transform: "scale(1.02) rotate(-1deg)",
          }}
          height={"470px"}
          position={"relative"}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          borderRadius={"20px"}
        >
          <Stack w={"full"}>
            <CardBody p={0}>
              <ImageCarousel
                // images={[challenge.desktopPreview, challenge.mobilePreview]}
                images={[challenge.ogImage]}
                isHovering={isHovering}
              />
              <Box p={"2rem"}>
                <DifficultyBars difficulty={challenge.difficulty} />
                <Heading fontSize={"2xl"} fontWeight={"bold"} mb={".5rem"}>
                  {challenge.title}
                </Heading>
                <Text
                  fontSize={"medium"}
                  dangerouslySetInnerHTML={{ __html: challenge.description }}
                  color={"gray.500"}
                  noOfLines={4}
                ></Text>
              </Box>
            </CardBody>
          </Stack>
        </Card>
      </Link>
    </SlideFade>
  );
};

const DifficultyBars = ({
  difficulty,
}: {
  difficulty: UIChallengeDifficulty;
}) => {
  const diffObj = CHALLENGE_DIFFICULTIES.find((d) => d.name === difficulty);
  if (!diffObj) return null;
  return (
    <VStack mb={"1rem"}>
      <Text
        fontWeight={"bold"}
        alignSelf={"end"}
        color={diffObj.colorScheme + ".400"}
        borderRadius={"5px"}
      >
        {diffObj.label}
      </Text>
      <SimpleGrid columns={5} w={"100%"} gap={3}>
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            h={".5rem"}
            borderRadius={"3px"}
            bg={diffObj.id < i ? "gray.300" : diffObj.colorScheme + ".400"}
          ></Box>
        ))}
      </SimpleGrid>
    </VStack>
  );
};

const ImageCarousel = ({
  images,
  isHovering,
}: {
  images: string[];
  isHovering: boolean;
}) => {
  // const [foo, setFoo] = useState(false);
  // useEffect(() => {
  //   if (!isHovering) return;
  //   const interval = setInterval(() => {
  //     toggle();
  //   }, 1500);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [isHovering]);
  // const toggle = () => {
  //   console.log("toggleing");
  //   if (isHovering) setFoo((p) => !p);
  // };
  return (
    <Box w={"100%"} position={"relative"}>
      <Flex
        flexDirection={"row"}
        transition={"all .2s ease-out"}
        overflow={"hidden"}
        borderRadius={"20px 20px 0 0"}
      >
        <Flex w={"100%"} basis={"100%"}>
          <Image
            src={images[0]}
            alt="challenge preview"
            width={600}
            height={600}
            style={{
              transition: "all .2s",
              scale: isHovering ? "1.15" : "1",
              width: "100%",
              height: "auto",
              aspectRatio: "1.6/1",
              borderRadius: isHovering ? "20px" : "20px 20px 0 0",
            }}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

"use client";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  useChallengeData,
  useMutateChallengeStart,
} from "hooks/useChallengesData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const UIChallengeSubmissionsPage = ({ params }) => {
  const { challengeSlug } = params;
  const {
    data,
    isLoading: challengeDataLoading,
    error,
  } = useChallengeData(challengeSlug);
  const { mutate, isLoading } = useMutateChallengeStart();

  const router = useRouter();
  const toast = useToast();

  if (challengeDataLoading) return <div>Loading...</div>;
  if (!data || error) return <div>error</div>;
  return (
    <Container maxW={"container.xl"} minH={"80vh"} px={0}>
      <SimpleGrid columns={{ base: 1, md: 2 }} my={"4rem"}>
        <Flex alignItems={"center"}>
          <Image
            src={data.desktopPreview}
            alt={"preview"}
            width={1000}
            height={1000}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "20px",
              justifyContent: "center",
            }}
          />
        </Flex>
        <Flex flexDir={"column"} p={"2rem"} justifyContent={"space-between"}>
          <Box>
            <Heading as={"h2"} mb={"2rem"} fontSize={"3rem"}>
              {data.title}
            </Heading>
            <Box
              dangerouslySetInnerHTML={{ __html: data.description }}
              fontSize={"1.25rem"}
            ></Box>
          </Box>
          <VStack>
            <Button
              w={"full"}
              colorScheme="purple"
              onClick={() => {
                mutate(data.id, {
                  onSuccess: () => {
                    toast({
                      title: "Challenge Started",
                      description: "You have started this challenge!",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    setTimeout(() => {
                      router.push(`/ui-challenges/${data.slug}`);
                    }, 500);
                  },
                });
              }}
              isLoading={isLoading}
            >
              Start Challenge
            </Button>
            <Link href={`/ui-challenges/`} style={{ width: "100%" }}>
              <Button colorScheme="gray" w={"full"}>
                Other Challenges
              </Button>
            </Link>
          </VStack>
        </Flex>
      </SimpleGrid>
      <Box>
        <Heading fontSize={"3rem"} as={"h2"}>
          Submissions
        </Heading>
        <Flex w={"full"} h={"full"} justifyContent={"center"}>
          <Text mt={"4rem"} color={"gray"}>
            {" "}
            No Submissions yet!
          </Text>
        </Flex>
      </Box>
    </Container>
  );
};

export default UIChallengeSubmissionsPage;

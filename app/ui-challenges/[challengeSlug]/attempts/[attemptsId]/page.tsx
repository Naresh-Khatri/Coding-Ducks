"use server";

import { Button, Flex, HStack, Link, Text, VStack } from "@chakra-ui/react";
import CodePreview from "_components/ui-challenges/CodePreview";
import UserAvatar from "_components/utils/UserAvatar";
import { getChallengeAttempt } from "hooks/useChallengesData";
import NextLink from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { challengeSlug: string; attemptsId: string };
}): Promise<Metadata> {
  const { challengeSlug, attemptsId } = params;

  const attempt = await getChallengeAttempt(challengeSlug, +attemptsId);
  const { ogImage, challenge, user } = attempt;

  return {
    title: `"${challenge.title}" built by ${user.username}`,
    description: `Hey there! I'm ${user.username} and I built this.`,
    openGraph: {
      images: [ogImage],
    },
  };
}

export default async function AttemptPage({ params }) {
  const { challengeSlug, attemptsId } = params;
  console.log(challengeSlug, attemptsId);
  const attempt = await getChallengeAttempt(challengeSlug, attemptsId);
  const { contentHEAD, contentHTML, contentCSS, contentJS, user, challenge } =
    attempt;
  return (
    <Flex direction={"column"} h={"100dvh"}>
      <HStack
        top={0}
        left={0}
        h={16}
        w={"full"}
        p={2}
        justifyContent={"space-between"}
      >
        <HStack>
          <Link as={NextLink} href={`/ui-challenges/${challengeSlug}`}>
            <Text fontWeight={"bold"}>{challenge.title}</Text>
          </Link>
        </HStack>
        <Link as={NextLink} href={`/ui-challenges/${challengeSlug}`}>
          <Button colorScheme="purple">Solve Challenge</Button>
        </Link>

        <HStack>
          <UserAvatar src={user?.photoURL} alt="user avatar" h={30} w={30} />
          <Link as={NextLink} href={`/users/${user?.username}`}>
            <Flex direction={"column"} alignItems={"center"}>
              <Text fontWeight={"bold"} ml={2}>
                {user?.username}
              </Text>
              <Text color={"gray.500"}>Author</Text>
            </Flex>
          </Link>
        </HStack>
      </HStack>
      {/* <iframe srcDoc={srcSet} style={{ flex: 1, width: "100%" }}></iframe> */}
      <CodePreview
        source={{
          head: contentHEAD,
          html: contentHTML,
          css: contentCSS,
          js: contentJS,
        }}
        target={{
          head: challenge.contentHEAD,
          html: challenge.contentHTML,
          css: challenge.contentCSS,
          js: challenge.contentJS,
        }}
      />
    </Flex>
  );
}

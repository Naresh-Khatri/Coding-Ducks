import {
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import NormalLayout from "../../layout/NormalLayout";

import {
  IUserStatsResponse,
  useUserData,
  useUserStats,
} from "../../hooks/useUsersData";
import SetMeta from "../../components/SEO/SetMeta";
import { baseURL } from "../../lib/axios";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { IUser } from "../../types";
import OverallStatsCard from "../../components/profile/OverallStatsCard";
import BadgesCard from "../../components/profile/BadgesCard";
import UserInfo from "../../components/profile/UserInfo";
import ExamStatsCard from "../../components/profile/ExamStatsCard";
import SubmissionsCalenderCard from "../../components/profile/SubmissionsCalenderCard";

function UsersPage({
  user,
  stats,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { username } = router.query;
  const toast = useToast();
  const {
    data: userData,
    isError: errorOnUserFetch,
    refetch: refetchUserData,
    isLoading: userDataLoading,
  } = useUserData({ username: "" + username, initalUserData: user });
  const {
    data: statsData,
    isError: errorOnStatsFetch,
    refetch: refetchStatsData,
    isLoading: statsDataLoading,
  } = useUserStats({
    username: "" + username,
    initalUserStats: stats,
  });

  useEffect(() => {
    if (!router.isReady || userDataLoading) return;
    refetchUserData();
    refetchStatsData();
    if (!userData || errorOnUserFetch || errorOnStatsFetch) {
      toast({
        title: "User not found",
        description: "The user you are looking for does not exist",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/users");
    }
  }, [router.query, router.isReady, errorOnUserFetch, errorOnStatsFetch]);

  // if (errorOnProgressFetch || errorOnUserFetch) return null;
  if (!userData) return <p>Loading...</p>;

  return (
    <NormalLayout>
      <SetMeta
        title={`${userData.username} - User Profile and Achievements`}
        description={`bio - ${userData?.bio}`}
        keywords={`${userData?.fullname}, user profile, coding achievements, coding solutions, community contributions`}
        image={userData?.photoURL}
        url={`https://www.codingducks.live/users/${userData?.username}`}
      />
      <Container maxW={"8xl"} minH={"100vh"}>
        <Flex
          display={{ base: "flex", md: "none" }}
          align={{ base: "center", md: "flex-start" }}
          justify={"center"}
          w={"100%"}
          h={"100%"}
          mt={[0, 0, 40]}
          flexBasis={"100%"}
          direction={{ base: "column", md: "row" }}
        >
          <UserInfo viewingUser={userData} viewingUserStats={statsData} />
          <OverallStatsCard statsData={statsData} />
          <BadgesCard userData={userData} />
          <ExamStatsCard examSubs={statsData.byExamId} />
          <SubmissionsCalenderCard
            subsData={statsData.dailySubmissions}
            isLoading={statsDataLoading}
          />
        </Flex>
        <Grid
          h="200px"
          templateRows="repeat(2, 1fr)"
          templateColumns="repeat(3, 1fr)"
          gap={4}
          mt={20}
          display={{ base: "none", md: "grid" }}
        >
          <GridItem rowSpan={2} colSpan={1}>
            <UserInfo viewingUser={userData} viewingUserStats={statsData} />
          </GridItem>
          <GridItem colSpan={2}>
            <HStack>
              <OverallStatsCard statsData={statsData} />
              <BadgesCard userData={userData} />
            </HStack>
          </GridItem>
          <GridItem colSpan={2}>
            <SubmissionsCalenderCard
              subsData={statsData.dailySubmissions}
              isLoading={statsDataLoading}
            />
            <ExamStatsCard examSubs={statsData.byExamId} />
          </GridItem>
          <GridItem colSpan={4} bg="tomato" />
        </Grid>
        <Grid templateColumns={"repeat(3, 1fr"}>
          <GridItem colSpan={1}></GridItem>
          <GridItem colSpan={2}></GridItem>
        </Grid>
      </Container>
    </NormalLayout>
  );
}
export default UsersPage;

export const getServerSideProps: GetServerSideProps<{
  user: IUser;
  stats: IUserStatsResponse;
}> = async ({ params }) => {
  const { username } = params;
  const res = await fetch(`${baseURL}/users/username/${username}`);
  const { data } = await res.json();
  const res2 = await fetch(`${baseURL}/users/username/${username}/stats`);
  const { data: data2 } = await res2.json();
  return {
    props: {
      user: data,
      stats: data2,
    },
  };
};

import { Box, Container, Flex, Text, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import UserInfo from "../../components/UserInfo";
import UserStats from "../../components/UserStats";

import NormalLayout from "../../layout/NormalLayout";
import SubsActivityCalendar from "../../components/SubsActivityCalendar";

import { useUserData, useUserProgress } from "../../hooks/useUsersData";

function UsersPage() {
  const router = useRouter();
  const { username } = router.query;
  const toast = useToast();
  const {
    data: userData,
    isError: errorOnUserFetch,
    refetch: refetchUserData,
    isLoading: userDataLoading,
  } = useUserData(username as string);
  const {
    data: progressData,
    isError: errorOnProgressFetch,
    refetch: refetchProgressData,
    isLoading: progressDataLoading,
  } = useUserProgress(username as string);

  useEffect(() => {
    if (!router.isReady || userDataLoading) return;
    refetchUserData();
    refetchProgressData();
    if (!userData || errorOnUserFetch || errorOnProgressFetch) {
      toast({
        title: "User not found",
        description: "The user you are looking for does not exist",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/users");
    }
  }, [router.query, router.isReady, errorOnUserFetch, errorOnProgressFetch]);

  if (errorOnProgressFetch || errorOnUserFetch) return null;

  return (
    <NormalLayout>
      <Container maxW={"8xl"} minH={"100vh"}>
        <Flex align="center" justify={"center"} w={"100%"} h={"100%"} mt={100}>
          <Flex>
            {userData && Object.keys(userData.data).length && (
              <UserInfo viewingUser={userData.data} />
            )}
          </Flex>
          <Flex flexGrow={1} ml={40}>
            {progressData &&
            Object.keys(progressData.data.byExamId).length > 0 ? (
              <UserStats progress={progressData.data.byExamId} />
            ) : (
              <Text fontSize={"2xl"}>No progress yet</Text>
            )}
          </Flex>
        </Flex>
        {progressData && Object.keys(progressData.data).length > 0 && (
          <Flex justify={"center"}>
            <Box w={"900px"} mt={20}>
              <Text fontSize={"xl"} fontWeight={"extrabold"} mb={5}>
                Submission history
              </Text>
              <SubsActivityCalendar
                subsData={progressData.data.dailySubmissions}
                isLoading={progressDataLoading}
              />
            </Box>
          </Flex>
        )}
      </Container>
    </NormalLayout>
  );
}
export default UsersPage;

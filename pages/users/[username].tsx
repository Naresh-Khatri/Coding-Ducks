import {
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  VStack,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import NormalLayout from "../../layout/NormalLayout";

import { getUser, getUserStats } from "../../hooks/useUsersData";
import SetMeta from "../../components/SEO/SetMeta";
import OverallStatsCard from "../../components/profile/OverallStatsCard";
import BadgesCard from "../../components/profile/BadgesCard";
import UserInfo from "../../components/profile/UserInfo";
import ExamStatsCard from "../../components/profile/ExamStatsCard";
import SubmissionsCalenderCard from "../../components/profile/SubmissionsCalenderCard";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

function UsersPage() {
  const [isMobile] = useMediaQuery("(max-width: 768px)", {
    fallback: true,
  });
  const router = useRouter();
  const { username } = router.query;
  const toast = useToast();

  const { data: userData } = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUser(username as string),
    refetchOnMount: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ["userStats", username],
    queryFn: () => getUserStats(username as string),
    refetchOnMount: false,
  });
  useEffect(() => {
    if (!userData || !statsData) {
      toast({
        title: "User not found",
        description: "The user you are looking for does not exist",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/users");
    }
  }, [router, toast, userData, statsData]);
  if (!userData) return <p> Loading... </p>;

  return (
    <NormalLayout>
      <SetMeta
        title={`${userData.username} - User Profile and Achievements`}
        description={`bio - ${userData?.bio}`}
        keywords={`${userData?.fullname}, user profile, coding achievements, coding solutions, community contributions`}
        image={userData?.photoURL}
        url={`https://www.codingducks.live/users/${userData?.username}`}
      />
      <Container maxW={"8xl"}>
        {isMobile ? (
          <VStack>
            <UserInfo viewingUser={userData} viewingUserStats={statsData} />
            <OverallStatsCard statsData={statsData} />
            <BadgesCard userData={userData} />
            <SubmissionsCalenderCard subsData={statsData.dailySubmissions} />
            <ExamStatsCard examSubs={statsData.byExamId} />
          </VStack>
        ) : (
          <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={20}>
            <GridItem rowSpan={2} colSpan={1}>
              <UserInfo viewingUser={userData} viewingUserStats={statsData} />
            </GridItem>
            <GridItem colSpan={2}>
              <HStack alignItems={"stretch"}>
                <OverallStatsCard statsData={statsData} />
                <BadgesCard userData={userData} />
              </HStack>
            </GridItem>
            <GridItem colSpan={2}>
              <SubmissionsCalenderCard subsData={statsData.dailySubmissions} />
              <ExamStatsCard examSubs={statsData.byExamId} />
            </GridItem>
          </Grid>
        )}
      </Container>
    </NormalLayout>
  );
}
export default UsersPage;

export const getServerSideProps = async ({ params }) => {
  const { username } = params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(["userStats", username], () =>
    getUserStats(username as string)
  );
  await queryClient.prefetchQuery(["user", username], () =>
    getUser(username as string)
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

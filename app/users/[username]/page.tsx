"use client";
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  VStack,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";

import NormalLayout from "../../../layout/NormalLayout";

import { getUser, getUserStats } from "../../../hooks/useUsersData";
import SetMeta from "../../../components/SEO/SetMeta";
import OverallStatsCard from "../../../components/profile/OverallStatsCard";
import BadgesCard from "../../../components/profile/BadgesCard";
import UserInfo from "../../../components/profile/UserInfo";
import ExamStatsCard from "../../../components/profile/ExamStatsCard";
import SubmissionsCalenderCard from "../../../components/profile/SubmissionsCalenderCard";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

function UsersPage() {
  const [isMobile] = useMediaQuery("(max-width: 768px)", {
    fallback: true,
  });
  const { username } = useParams() as { username: string };
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUser(username as string),
    refetchOnMount: false,
  });

  const { data: statsData, isLoading: userStatsLoading } = useQuery({
    queryKey: ["userStats", username],
    queryFn: () => getUserStats(username as string),
    refetchOnMount: false,
  });
  if (userDataLoading || userStatsLoading) return <p>loading</p>;
  if (!userData) return <p>user not found</p>;
  if (!statsData) return <p> waiting</p>;
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

// export const getServerSideProps = async ({ params }) => {
//   const { username } = params;
//   const queryClient = new QueryClient();
//   await queryClient.prefetchQuery(["userStats", username], () =>
//     getUserStats(username as string)
//   );
//   await queryClient.prefetchQuery(["user", username], () =>
//     getUser(username as string)
//   );

//   return {
//     props: {
//       dehydratedState: dehydrate(queryClient),
//     },
//   };
// };

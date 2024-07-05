import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  useColorModeValue,
  Flex,
  SimpleGrid,
  SkeletonText,
  Spacer,
  Skeleton,
} from "@chakra-ui/react";
import { useContext } from "react";
import ExamCard from "../../_components/ExamCard";
import { userContext } from "../../contexts/userContext";
import { getExams } from "../../hooks/useExamsData";

import NormalLayout from "../../layout/NormalLayout";
import SetMeta from "../../_components/SEO/SetMeta";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";

export default function ExamPage() {
  const { data: exams } = useQuery({
    queryKey: ["exams"],
    queryFn: getExams,
    refetchOnMount: true,
  });
  const { user } = useContext(userContext);

  // const currTime = new Date().getTime();
  // const availableExams = exams?.filter(
  //   (exam) =>
  //     exam.isBounded === false || new Date(exam.endTime).getTime() > currTime
  // );
  // const upcomingExams = exams?.filter(
  //   (exam) =>
  //     exam.isBounded === true && new Date(exam.endTime).getTime() > currTime
  // );

  return (
    <>
      <SetMeta
        title="Exams - Coding Ducks"
        description="Take coding exams and assessments on Coding Ducks to assess your programming proficiency. Prepare for interviews and showcase your coding abilities in Python, JavaScript, C++, and Java."
        url=""
      />
      <NormalLayout>
        <Container maxW={"6xl"}>
          {user && (
            <Heading my={10}>
              <Text as={"span"} fontSize={"3xl"}>
                Welcome Back {user.fullname}!
              </Text>
            </Heading>
          )}

          <SimpleGrid columns={[1, 2, 3]} spacing={10} placeItems="center">
            {exams?.map((exam) => (
              <ExamCard key={exam.id} examData={exam} />
            ))}
          </SimpleGrid>
        </Container>
      </NormalLayout>
    </>
  );
}

const ExamCardLoading = () => {
  return (
    <Flex
      direction={"column"}
      bg={useColorModeValue("white", "gray.700")}
      boxShadow={"2xl"}
      w={300}
      h={420}
      borderRadius={20}
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: "scale(1.05)",
      }}
    >
      <Box w={300} h={180} position={"relative"} overflow={"hidden"}>
        <Skeleton w={300} h={180} borderRadius={"20px"} />
      </Box>
      <Stack p={3}>
        <Text
          color={"green.500"}
          textTransform={"uppercase"}
          fontWeight={800}
          fontSize={"sm"}
          letterSpacing={1.1}
        >
          Exam
        </Text>

        <Skeleton>
          <Heading
            color={useColorModeValue("gray.700", "white")}
            fontSize={"2xl"}
            fontFamily={"body"}
            noOfLines={1}
          >
            Loading
          </Heading>
        </Skeleton>
        <SkeletonText noOfLines={3} spacing="4" />
      </Stack>
      <Spacer />
      <Button bg={"purple.600"} mb={4} mx={2} isLoading>
        Show details
      </Button>
    </Flex>
  );
};

export const getServerSideProps = async () => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(["exams"], getExams);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

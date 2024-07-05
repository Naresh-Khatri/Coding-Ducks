import {
  Card,
  Center,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Grid,
  GridItem,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";

function ExamStatsCard({ examSubs }) {
  return (
    <Card w={"100%"} bg={"whiteAlpha.100"} borderRadius={10} p={5} mb={5}>
      <Text fontWeight={"extrabold"} fontSize={"xl"} mb={2}>
        Exam Stats
      </Text>
      <VStack gap={{ base: 4, md: 0 }}>
        {Object.entries(examSubs).length > 0 ? (
          Object.entries(examSubs).map((entry) => (
            <ExamCard key={entry[0]} submissions={entry[1]} />
          ))
        ) : (
          <Text mt={10} color={"whiteAlpha.400"} textAlign={"center"}>
            Not appeared in any exams
          </Text>
        )}
      </VStack>
    </Card>
  );
}

const ExamCard = ({ submissions }) => {
  // console.log(submissions)
  return (
    <Link href={`/contests/${submissions[0].slug}`} style={{ width: "100%" }}>
      <Grid
        style={{ margin: "10px 0" }}
        h={{ base: 30, md: 50 }}
        w={"100%"}
        templateColumns="repeat(5, 1fr)"
      >
        <GridItem colSpan={1}>
          <Center h={"100%"}>
            <CircularProgress
              value={submissions.length * 10}
              size={59}
              color={submissions.length === 10 ? "green.600" : "purple.600"}
            >
              <CircularProgressLabel>
                {submissions.length * 10}%
              </CircularProgressLabel>
            </CircularProgress>
          </Center>
        </GridItem>
        <GridItem
          colSpan={4}
          borderRadius={[10, 10, 20]}
          bg={submissions.length === 10 ? "green.600" : "purple.600"}
        >
          <Flex align={"center"} h={"100%"} pl={{ base: 5, md: 10 }}>
            <Text fontSize={["lg", "xl"]} fontWeight={"extrabold"}>
              {submissions[0].title}
            </Text>
          </Flex>
        </GridItem>
      </Grid>
    </Link>
  );
};

export default ExamStatsCard;

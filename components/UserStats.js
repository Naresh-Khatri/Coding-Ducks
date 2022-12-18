import {
  Box,
  Button,
  Center,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";

function UserStats({ progress }) {
  // console.log(progress);
  return (
    <Box w="100%" p={5}>
      <Text>Progress</Text>
      {Object.entries(progress).map((entry) => (
        <ExamCard key={entry[0]} submissions={entry[1]} />
      ))}
    </Box>
  );
}

const ExamCard = ({ submissions }) => {
  // console.log(submissions)
  return (
    <Link href={`/take-test/${submissions[0].Exam.slug}`}>
      <Grid h={100} w={"100%"} templateColumns="repeat(5, 1fr)" m={2}>
        <GridItem colSpan={1}>
          <Center h={"100%"}>
            <CircularProgress
              value={submissions.length * 10}
              size="100px"
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
          borderRadius={20}
          bg={submissions.length === 10 ? "green.600" : "purple.600"}
        >
          <Flex align={"center"} h={"100%"} pl={10}>
            <Text fontSize={["lg", "xl", "3xl"]} fontWeight={"extrabold"}>
              {submissions[0].Exam.title}
            </Text>
          </Flex>
        </GridItem>
      </Grid>
    </Link>
  );
};

export default UserStats;

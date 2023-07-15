import {
  Container,
  Flex,
  HStack,
  IconButton,
  Select,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import NormalLayout from "../../layout/NormalLayout";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useContext, useState } from "react";
import { useProblemsData } from "../../hooks/useProblemsData";
import { userContext } from "../../contexts/userContext";
import ProblemRow from "../../components/problem/ProblemRow";

function ProblemsPage() {
  const { user } = useContext(userContext);
  console.log(user);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const { data, isLoading, error } = useProblemsData({
    limit,
    skip,
  });
  const problemsList = data?.problemsList || [];
  const count = data?.count || 0;

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setSkip(0);
  };
  const changeSkip = (direction: "left" | "right") => {
    if (direction === "left") {
      setSkip((p) => Math.ceil(p - limit));
    } else {
      setSkip((p) => Math.ceil(p + limit));
    }
  };

  if (error) return <h1>Something went wrong</h1>;

  return (
    <NormalLayout>
      <Container maxW="container.xl">
        {/* <Box
          h={200}
          borderRadius={"20px"}
          my={10}
          border={"5px solid gray"}
        ></Box> */}
        {isLoading ? (
          <Stack>
            {[1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} height="20px" width={"100%"} />
            ))}
          </Stack>
        ) : (
          <TableContainer mt={24}>
            <Table variant="striped" size={"md"}>
              <Thead>
                <Tr>
                  <Th>Status</Th>
                  <Th>Title</Th>
                  <Th>Acceptance</Th>
                  <Th>Difficulty</Th>
                  <Th>Solved by</Th>
                </Tr>
              </Thead>
              <Tbody style={{ position: "relative" }}>
                {problemsList.map((problem, idx) => (
                  <ProblemRow
                    key={idx}
                    index={idx}
                    problem={problem}
                    isLocked={idx >= 10 && user?.isNoob}
                  />
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
        <Flex my={5} justifyContent="space-between" align="center">
          <HStack>
            <Select onChange={(e) => changeLimit(+e.target.value)}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
            <Text> /page</Text>
          </HStack>

          <Stack direction={"row"} spacing={4} alignItems={"center"}>
            <Text>
              Showing {skip + 1} to {Math.min(count, skip + limit)} of {count}{" "}
              Problems
            </Text>
            <IconButton
              isDisabled={skip === 0}
              onClick={() => changeSkip("left")}
              aria-label="previous page"
              icon={<ChevronLeftIcon />}
            />
            <IconButton
              isDisabled={skip + limit > count}
              onClick={() => changeSkip("right")}
              aria-label="next page"
              icon={<ChevronRightIcon />}
            />
          </Stack>
        </Flex>
      </Container>
    </NormalLayout>
  );
}

export default ProblemsPage;

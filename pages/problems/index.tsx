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
import { getProblems } from "../../hooks/useProblemsData";
import { userContext } from "../../contexts/userContext";
import ProblemRow from "../../_components/problem/ProblemRow";
import SetMeta from "../../_components/SEO/SetMeta";
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";

function ProblemsPage() {
  const { user } = useContext(userContext);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems", { limit, skip }],
    queryFn: () => getProblems({ params: { limit, skip } }),
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
      <SetMeta
        title="Coding Ducks - Coding Problems Collection"
        description="Explore our diverse collection of coding problems on Coding Ducks. Enhance your programming skills and solve algorithmic challenges in Python, JavaScript, C++, and Java."
        keywords="coding problems, algorithmic challenges, programming exercises, problem-solving, Python, JavaScript, C++, Java"
        url="https://www.codingducks.xyz/problems"
      />
      <Container maxW="container.xl" px={{ base: 0, md: 4 }}>
        {isLoading ? (
          <Stack>
            {[1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} height="20px" width={"100%"} />
            ))}
          </Stack>
        ) : (
          <TableContainer mt={{ base: 16, md: 24 }}>
            <Table variant="striped" size={"md"}>
              <Thead>
                <Tr>
                  <Th px={{ base: 1, md: 3 }}>Status</Th>
                  <Th px={{ base: 1, md: 3 }}>Title</Th>
                  {/* <Th px={{ base: 1, md: 3 }}>Acceptance</Th> */}
                  <Th px={{ base: 1, md: 3 }}>Difficulty</Th>
                  <Th px={{ base: 1, md: 3 }}>Solved by</Th>
                </Tr>
              </Thead>
              <Tbody style={{ position: "relative" }}>
                {problemsList.map((problem, idx) => (
                  <ProblemRow
                    key={idx}
                    index={idx}
                    problem={problem}
                    isLocked={idx >= 10 && (user?.isNoob || false)}
                  />
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
        <Flex
          my={5}
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between"
          align="center"
        >
          <HStack>
            <Select onChange={(e) => changeLimit(+e.target.value)}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
            <Text> /page</Text>
          </HStack>

          <Flex
            mt={{ base: 5, md: 0 }}
            direction={{ base: "column", md: "row" }}
            alignItems={"center"}
          >
            <Text>
              Showing {skip + 1} to {Math.min(count, skip + limit)} of {count}{" "}
              Problems
            </Text>
            <HStack spacing={4} mt={{ base: 3, md: 0 }}>
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
            </HStack>
          </Flex>
        </Flex>
      </Container>
    </NormalLayout>
  );
}

export const getStaticProps = async () => {
  try {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(["problems", { limit: 20, skip: 0 }], () =>
      getProblems({ params: { limit: 20, skip: 0 } })
    );
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {},
    };
  }
};

export default ProblemsPage;

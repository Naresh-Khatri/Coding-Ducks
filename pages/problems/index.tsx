import {
  Avatar,
  AvatarGroup,
  Box,
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
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import NormalLayout from "../../layout/NormalLayout";
import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useProblemsData } from "../../hooks/useProblemsData";

function ProblemsPage() {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
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
          <TableContainer>
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
              <Tbody>
                {problemsList.map((problem) => (
                  <Tr key={problem.id}>
                    <Td>
                      {problem.status === "attempted" ? (
                        "A"
                      ) : problem.status === "solved" ? (
                        <CheckIcon color="green.500" />
                      ) : null}
                    </Td>
                    <Td>
                      <Link href={`/problems/${problem.slug}`}>
                        <Text>
                          {problem.frontendProblemId}. {problem.title}
                        </Text>
                      </Link>
                    </Td>
                    <Td>{problem.accuracy || "-"}</Td>
                    <Td>
                      <Text
                        fontWeight={"bold"}
                        color={
                          problem.difficulty === "easy"
                            ? "green.300"
                            : problem.difficulty === "medium"
                            ? "orange.300"
                            : "red.300"
                        }
                      >
                        {problem.difficulty}
                      </Text>
                    </Td>
                    <Td m={0} p={0} pl={5}>
                      <AvatarGroup size="md" max={2} h={"50px"}>
                        {problem.submissions.map((submission, idx) => (
                          <Link
                            key={idx}
                            href={`/users/${submission.User.username}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                              zIndex: 1,
                            }}
                          >
                            <Avatar
                              size={"md"}
                              name={submission.User.fullname}
                              src={submission.User.photoURL}
                            />
                          </Link>
                        ))}
                      </AvatarGroup>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
        <Flex my={5} justifyContent="space-between" align="center">
          <HStack>
            <Select onChange={(e) => changeLimit(+e.target.value)}>
              <option value={10}>10</option>
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

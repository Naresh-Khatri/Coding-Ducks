import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
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
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
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
        <Box
          h={200}
          borderRadius={"20px"}
          my={10}
          border={"5px solid gray"}
        ></Box>
        {isLoading ? (
          <Stack>
            {[1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} height="20px" width={"100%"} />
            ))}
          </Stack>
        ) : (
          <TableContainer>
            <Table variant="striped" size={"sm"}>
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
                      {problem.status === "attempted"
                        ? "A"
                        : problem.status === "solved"
                        ? "S"
                        : "X"}
                    </Td>
                    <Td>
                      <Link href={`/problems/${problem.slug}`}>
                        <Text>
                          {problem.id}. {problem.title}
                        </Text>
                      </Link>
                    </Td>
                    <Td>{problem.acceptance || "-"}</Td>
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
                    <Td>
                      <AvatarGroup size="md" max={2}>
                        <Avatar
                          size={"xs"}
                          name="Ryan Florence"
                          src="https://bit.ly/ryan-florence"
                        />
                        <Avatar
                          size={"xs"}
                          name="Segun Adebayo"
                          src="https://bit.ly/sage-adebayo"
                        />
                        <Avatar
                          size={"xs"}
                          name="Kent Dodds"
                          src="https://bit.ly/kent-c-dodds"
                        />
                        <Avatar
                          size={"xs"}
                          name="Prosper Otemuyiwa"
                          src="https://bit.ly/prosper-baba"
                        />
                        <Avatar
                          size={"xs"}
                          name="Christian Nwamba"
                          src="https://bit.ly/code-beast"
                        />
                      </AvatarGroup>
                      {/* <Link href={`/problems/${problem.slug}`}>
                        <Button colorScheme="purple">solve</Button>
                      </Link> */}
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

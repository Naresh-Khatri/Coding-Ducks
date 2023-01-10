import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spacer,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProblemRow from "../../components/admin/ProblemRow";
import AdminLayout from "../../layout/AdminLayout";
import axios from "../../utils/axios";

function ProblemPage() {
  useEffect(() => {
    const getProblems = async () => {
      const { data } = await axios.get("/problems");
      setProblems(data);
      setFilteredProblems(data);
    };
    getProblems();
  }, []);

  const [problems, setProblems] = useState();
  const [filteredProblems, setFilteredProblems] = useState();
  const [examsList, setExamsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // console.log(problems);
  const fetchProblems = async () => {
    const res = await axios("/problems");
    console.log(res.data);
    setProblems(res.data);
  };
  useEffect(() => {
    const list = [];
    problems?.forEach((problem) => {
      if (!list.find((exam) => exam.id === problem.examId))
        list.push({
          id: problem.examId,
          title: problem.exam.title,
          slug: problem.exam.slug,
        });
    });
    setExamsList(list);
    // console.log(list);
  }, [problems]);

  const handleOnFilterChange = (e) => {
    setSearchTerm("");
    if (e.target.value === "all") {
      setFilteredProblems(problems);
    } else {
      setFilteredProblems(
        problems
          .filter((problem) => problem.examId === +e.target.value)
          .sort((a, b) => a.order - b.order)
      );
    }
  };

  const handleOnSearchChange = (e) => {
    const search = e.target.value;
    setSearchTerm(search);
    if (search === "") {
      setFilteredProblems(problems);
    } else {
      setFilteredProblems(
        problems.filter((problem) =>
          problem.title.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  };

  if (filteredProblems == undefined) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Container maxW="container.xl" overflowY={"scroll"}>
        <Flex m={10} justify="space-between">
          <Link href="/dashboard/add-problem">
            <Button bg="green.400">Add Problem</Button>
          </Link>
          <Box>
            <InputGroup size="md">
              <Input
                pr="4.5rem"
                placeholder="Search titles"
                value={searchTerm}
                onChange={handleOnSearchChange}
              />
              {searchTerm != "" && (
                <InputRightElement>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleOnSearchChange({ target: { value: "" } })
                    }
                  >
                    <CloseIcon />
                  </Button>
                </InputRightElement>
              )}
            </InputGroup>
          </Box>
          <HStack>
            <Text> {filteredProblems.length} Problem(s)</Text>
            <FormControl>
              <FormLabel htmlFor="exam">Filter by exam</FormLabel>
              <Select id="exam" onChange={handleOnFilterChange}>
                <option value="all">All</option>
                {examsList.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>
        </Flex>
        <TableContainer>
          <Table variant="simple">
            <TableCaption>ProblemPage</TableCaption>
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>order</Th>
                <Th>difficulty</Th>
                <Th>Title</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProblems.map((problem, index) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  fetchProblems={fetchProblems}
                  examsList={examsList}
                />
              ))}
            </Tbody>
            {/* <Tfoot>
              <Tr>
                <Th>To convert</Th>
                <Th>into</Th>
                <Th isNumeric>multiply by</Th>
              </Tr>
            </Tfoot> */}
          </Table>
        </TableContainer>
      </Container>
    </AdminLayout>
  );
}

export default ProblemPage;

// export async function getServerSideProps() {
//   try {
//     const res = await axios("/problems");
//     return {
//       props: {
//         initialProblems: res.data,
//       },
//     };
//   } catch (err) {
//     console.log(err);
//   }
// }

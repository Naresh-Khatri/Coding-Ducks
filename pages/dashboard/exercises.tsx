import {
  Box,
  Button,
  Container,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProblemRow from "../../components/admin/ProblemRow";
import AdminLayout from "../../layout/AdminLayout";
import axios from "../../utils/axios";

function ExercisePage() {
  const [problems, setProblems] = useState([]);
  const fetchProblems = async () => {
    const res = await axios("/problems");
    setProblems(res.data);
  };
  useEffect(() => {
    fetchProblems();
  }, []);
  return (
    <AdminLayout>
      <Container maxW="container.xl" overflowY={'scroll'}>
        <Box m={10}>
          <Link href="/dashboard/add-exercise">
            <Button bg="green.400">Add Problem</Button>
          </Link>
        </Box>
        <TableContainer>
          <Table variant="simple">
            <TableCaption>Exercise Page</TableCaption>
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
              {/* {problems.map((problem, index) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  fetchProblems={fetchProblems}
                />
              ))} */}
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

export default ExercisePage;

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
import ExamRow from "../../components/admin/ExamRow";
import AdminLayout from "../../layout/AdminLayout";

import axios from "../../utils/axios";

function Exams() {
  const [exams, setExams] = useState([]);
  const fetchExams = async () => {
    try {
      const res = await axios.get("/exams");
      setExams(res.data);
    } catch (error) {}
  };
  useEffect(() => {
    fetchExams();
  }, []);
  return (
    <AdminLayout>
      <Container maxW="container.xl" overflow={"auto"}>
        <Box m={10}>
          <Link href="/dashboard/add-exam">
            <Button bg="green.400">Add Exam</Button>
          </Link>
          <Button bg="green.400" onClick={fetchExams}>
            Refresh
          </Button>
        </Box>
        <TableContainer>
          <Table variant="simple">
            <TableCaption>Exams</TableCaption>
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Cover image</Th>
                <Th>Title</Th>
                <Th>Starts on</Th>
                <Th>active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {exams.map((exam) => (
                <ExamRow key={exam.id} exam={exam} fetchExams={fetchExams} />
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

export default Exams;

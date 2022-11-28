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

function Exams() {
  const [exams, setExams] = useState([]);
  const fetchExams = async () => {
    const res = await fetch("http://localhost:3333/exams");
    const data = await res.json();
    setExams(data);
  };
  useEffect(() => {
    fetchExams();
  }, []);
  return (
    <AdminLayout>
      <Container maxW="container.xl">
        <Box m={10}>
          <Link href="/dashboard/add-exam">
            <Button bg="green.400">Add Exam</Button>
          </Link>
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

import { Box, Button, Container, HStack } from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";

import { useExamsData } from "../../hooks/useExamsData";
import CustomTable from "../../_components/CustomTable";

const COLUMNS = [
  {
    Header: "ID",
    accessor: "id",
  },
  {
    Header: "Cover Image",
    accessor: "coverImg",
  },
  {
    Header: "Title",
    accessor: "title",
  },
  {
    Header: "Starts on",
    accessor: "",
  },
  {
    Header: "Active",
    accessor: "active",
  },
  {
    Header: "Actions",
    accessor: "",
  },
];

function Exams() {
  const {
    data: examsData,
    isLoading: examsDataIsLoading,
    error: examsDataError,
    refetch: refetchExamData,
  } = useExamsData();
  console.log(examsData);

  if (examsDataIsLoading || !examsData) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Container maxW="container.xl" overflow={"auto"}>
        <HStack m={10}>
          <Link href="/dashboard/add-exam">
            <Button bg="green.400">Add Exam</Button>
          </Link>
          <Button bg="green.400" onClick={() => refetchExamData()}>
            Refresh
          </Button>
        </HStack>
        <CustomTable
          columns={COLUMNS}
          data={examsData}
          refetchData={refetchExamData}
          hasSort
        />
      </Container>
    </AdminLayout>
  );
}

export default Exams;

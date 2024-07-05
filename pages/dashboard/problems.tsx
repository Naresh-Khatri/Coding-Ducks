import {
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  useDisclosure,
} from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";
import { useAllProblemsData } from "../../hooks/useProblemsData";
import CustomTable from "../../_components/CustomTable";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import FAIcon from "../../_components/FAIcon";

const COLUMNS = [
  {
    Header: "ID",
    accessor: "id",
  },
  {
    Header: "Frontend ID",
    accessor: "frontendProblemId",
  },
  {
    Header: "Title",
    accessor: "title",
  },
  {
    Header: "Difficulty",
    accessor: "difficulty",
  },
  {
    Header: "Exam",
    accessor: "examId",
    filter: "equals",
  },
  {
    Header: "Order",
    accessor: "order",
  },
  {
    Header: "Active",
    accessor: "isActive",
  },
  {
    Header: "Actions",
  },
];
function ProblemPage() {
  const [allowExams, setAllowExams] = useState(false);
  const {
    data: problemsData,
    isLoading: problemsDataIsLoading,
    error: problemsDataError,
    refetch: fetchProblems,
  } = useAllProblemsData(allowExams);

  const { onOpen, onClose, isOpen } = useDisclosure();

  if (problemsDataIsLoading || !problemsData) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Container maxW="container.xl" overflowY={"auto"}>
        <Flex direction={"column"} h={"100%"}>
          <HStack my={10} justify="space-between">
            <Link href="/dashboard/add-problem">
              <Button bg="green.400">Add Problem</Button>
            </Link>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="allow-exams" mb="0">
                Show Exams Problems
              </FormLabel>
              <Switch
                id="allow-exams"
                isChecked={allowExams}
                onChange={(e) => setAllowExams(e.target.checked)}
              />
            </FormControl>
            <Button onClick={onOpen} leftIcon={<FAIcon icon={faTags} />}>
              Edit Tags
            </Button>
          </HStack>
          <CustomTable
            columns={COLUMNS}
            data={problemsData.problems}
            examsList={problemsData.examsList}
            refetchData={fetchProblems}
            hasSearchBar={true}
            hasSort={true}
          />
        </Flex>
      </Container>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody></ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

export default ProblemPage;

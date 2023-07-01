import {
  Button,
  Container,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import Link from "next/link";
import AdminLayout from "../../layout/AdminLayout";
import { useAllProblemsData } from "../../hooks/useProblemsData";
import CustomTable from "../../components/CustomTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

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
    Header: "Actions",
  },
];
function ProblemPage() {
  const {
    data: problemsData,
    isLoading: problemsDataIsLoading,
    error: problemsDataError,
    refetch: fetchProblems,
  } = useAllProblemsData();

  const { onOpen, onClose, isOpen } = useDisclosure();
  console.log(problemsData);

  if (problemsDataIsLoading || !problemsData) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <Container maxW="container.xl" overflowY={"scroll"}>
        <HStack my={10} justify="space-between">
          <Link href="/dashboard/add-problem">
            <Button bg="green.400">Add Problem</Button>
          </Link>
          <Button
            onClick={onOpen}
            leftIcon={<FontAwesomeIcon icon={faTags as IconProp} />}
          >
            Edit Tags
          </Button>
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
        </HStack>
        <CustomTable
          columns={COLUMNS}
          data={problemsData.problems}
          examsList={problemsData.examsList}
          refetchData={fetchProblems}
          hasSearchBar={true}
          hasSort={true}
        />
      </Container>
    </AdminLayout>
  );
}

export default ProblemPage;

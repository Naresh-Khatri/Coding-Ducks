import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

import { useEffect, useRef, useState } from "react";
import axios from "../../utils/axios";
import Image from "next/image";
import TestCaseRow from "./TestCaseRow";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

function ProblemEditor({
  isOpen,
  onClose,
  problemData,
  onEditSuccess,
  examsList,
}) {
  const { title, description, difficulty, examId, order, testCases } =
    problemData;
  const [newOrder, setNewOrder] = useState(order);
  const [newTitle, setNewTitle] = useState(title);
  const [newDifficulty, setNewDifficulty] = useState(difficulty);
  const [newDescription, setNewDescription] = useState(
    description.replace(/\\n/g, " ")
  );
  const [newTestCases, setNewTestCases] = useState(testCases);

  const [selectedExam, setSelectedExam] = useState(examId);
  const toast = useToast();

  const updateProblem = async () => {
    const payload = {
      order: +newOrder,
      title: newTitle,
      description: newDescription,
      difficulty: newDifficulty,
      testCases: newTestCases,
      examId: selectedExam,
    };
    try {
      const res = await axios.patch(`/problems/${problemData.id}`, payload);
      toast({
        title: "Problem updated!",
        status: "success",
        description: "Problem has been updated.",
        duration: 9000,
        isClosable: true,
      });
      onEditSuccess();
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        status: "error",
        description: "Something went wrong",
        duration: 9000,
        isClosable: true,
      });
    }
  };
  if (!problemData || !examsList) return <Box> loading... </Box>;
  // console.log(examsList);
  return (
    <Modal onClose={onClose} size={"4xl"} isOpen={isOpen}>
      <ModalOverlay backdropFilter="auto" backdropBlur="2px" />
      <ModalContent>
        <ModalHeader>Edit Problem</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* {JSON.stringify(problemData, null, 2)} */}
          <HStack my={3}>
            <FormControl>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="order">
                Order (This helps sort the problems)
              </FormLabel>
              <Input
                id="order"
                placeholder="order"
                value={newOrder}
                type="number"
                onChange={(e) => setNewOrder(e.target.value)}
              />
            </FormControl>
            <RadioGroup onChange={setNewDifficulty} value={newDifficulty}>
              <Stack direction="row">
                <Radio value="easy">Easy</Radio>
                <Radio value="medium">Medium</Radio>
                <Radio value="hard">hard</Radio>
              </Stack>
            </RadioGroup>
          </HStack>
          {/* <HStack my={3}>
            <FormControl>
              <FormLabel htmlFor="slug">Slug</FormLabel>
              <Input
                id="slug"
                placeholder="Slug"
                value={newSlug}
                onChange={(e) => setNewSlug(encodeURI(e.target.value))}
              />
            </FormControl>
          </HStack> */}

          <FormControl my={3}>
            <FormLabel htmlFor="desc">Description</FormLabel>

            <Box bg="white" color={"black"} borderRadius={10}>
              <QuillNoSSRWrapper
                style={{ borderRadius: 10 }}
                theme="snow"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    ["code"],
                    [
                      { list: "ordered" },
                      { list: "bullet" },
                      { indent: "-1" },
                      { indent: "+1" },
                    ],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                value={newDescription}
                onChange={setNewDescription}
              />
            </Box>
          </FormControl>
          <FormControl mt="2%">
            <FormLabel htmlFor="email" fontWeight={"normal"}>
              Select Exam
            </FormLabel>
            <Select
              value={selectedExam}
              onChange={(e) => setSelectedExam(+e.target.value)}
            >
              {examsList.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {`${exam.title} - /exmas/${exam.slug}`}
                </option>
              ))}
            </Select>
          </FormControl>
          <Flex mt={10}>
            <TableContainer w={"100%"}>
              <Text>Test Cases: {testCases.length}</Text>
              <Table variant="simple">
                {/* <TableCaption>Exams</TableCaption> */}
                <Thead>
                  <Tr>
                    <Th>Id</Th>
                    <Th>Input</Th>
                    <Th>Output</Th>
                    <Th>explaination</Th>
                    <Th>Public</Th>
                    <Th>Remove</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {newTestCases.map((testCase, index) => (
                    <TestCaseRow
                      testCases={newTestCases}
                      key={index}
                      index={index}
                      setTestCases={setNewTestCases}
                    />
                  ))}
                </Tbody>
              </Table>
              <Button
                onClick={() => {
                  console.log("lskdjflkj");
                  setNewTestCases((p) => [
                    ...p,
                    {
                      id: p.length + 1,
                      input: "",
                      output: "",
                      explaination: "",
                      isPublic: false,
                    },
                  ]);
                }}
              >
                Add a test case
              </Button>
            </TableContainer>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button bg="purple.500" onClick={updateProblem}>
              Update
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ProblemEditor;

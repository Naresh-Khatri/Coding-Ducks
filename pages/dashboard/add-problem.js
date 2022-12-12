import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  FormHelperText,
  Text,
  HStack,
  RadioGroup,
  Radio,
  Stack,
  Switch,
  Textarea,
  IconButton,
  TableContainer,
  Table,
  TableCaption,
  Thead,
  Tr,
  Th,
  Tbody,
  Container,
  Select,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import TestCaseRow from "../../components/admin/TestCaseRow";
import axios from "../../utils/axios";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddExam = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diffLevel, setDiffLevel] = useState("easy");
  const [examsList, setExamsList] = useState([]);
  const [testCases, setTestCases] = useState([
    { id: 0, input: "", output: "", explaination: "", isPublic: false },
  ]);

  const selectedExam = useRef(null);
  // const [tags, setTags] = useState([]);

  const router = useRouter();

  const toast = useToast();
  const submit = async () => {
    const payload = {
      title,
      description: desc,
      difficulty: diffLevel,
      tags: "aksdfl",
      testCases,
      examId: +selectedExam.current.value,
    };
    // console.log(payload)
    // return
    try {
      const res = await axios.post("/problems", payload);
      console.log(res);
      toast({
        title: "Exam created!",
        status: "success",
        description: "New exam has been created.",
        duration: 9000,
        isClosable: true,
      });
      router.push("/dashboard/problems");
    } catch (error) {
      toast({
        title: "Please check the fields!",
        description: "An error has occured.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      console.log(error);
    }
  };

  const fetchExams = async () => {
    const res = await axios.get("/exams");
    setExamsList(res.data);
    // console.log(res);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <>
      <AdminLayout>
        <Flex
          direction={"column"}
          p={10}
          w={"100%"}
          alignItems="center"
          overflowY="scroll"
        >
          <Container maxW={"8xl"} overflowY="scroll">
            <Heading
              w="100%"
              textAlign={"center"}
              fontWeight={"extrabold"}
              fontSize={"4xl"}
              mb={20}
            >
              Create a problem!
            </Heading>
            <HStack my={3}>
              <FormControl mr="5%">
                <FormLabel htmlFor="first-name" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input
                  id="first-name"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>
              <RadioGroup onChange={setDiffLevel} value={diffLevel}>
                <Stack direction="row">
                  <Radio value="easy">Easy</Radio>
                  <Radio value="medium">Medium</Radio>
                  <Radio value="hard">hard</Radio>
                </Stack>
              </RadioGroup>
            </HStack>

            <FormControl mt="2%">
              <FormLabel htmlFor="email" fontWeight={"normal"}>
                Description
              </FormLabel>
              <Box bg="white" color={"black"}>
                <QuillNoSSRWrapper
                  theme="snow"
                  value={desc}
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
                  onChange={setDesc}
                />
              </Box>
              <FormHelperText>Describe about your exam</FormHelperText>
            </FormControl>
            <FormControl mt="2%">
              <FormLabel htmlFor="email" fontWeight={"normal"}>
                Select Exam
              </FormLabel>
              <Select ref={selectedExam}>
                {examsList.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {`${exam.title} - /exams/${exam.slug}`}
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
                    {testCases.map((testCase, index) => (
                      <TestCaseRow
                        testCases={testCases}
                        key={index}
                        index={index}
                        setTestCases={setTestCases}
                      />
                    ))}
                  </Tbody>
                </Table>
                <Button
                  onClick={() => {
                    setTestCases((p) => [
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
            <FormControl>
              <Button bg="green.500" mt={3} onClick={submit}>
                Create
              </Button>
            </FormControl>
          </Container>
        </Flex>
      </AdminLayout>
    </>
  );
};

export default AddExam;

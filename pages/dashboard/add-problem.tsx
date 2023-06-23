import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  HStack,
  RadioGroup,
  Radio,
  Stack,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Container,
  Select,
  Checkbox,
  VStack,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import TestCaseRow from "../../components/admin/TestCaseRow";
import axios from "../../utils/axios";
import { IProblemTag, useTagsData } from "../../hooks/useProblemsData";
import { useExamData, useExamsData } from "../../hooks/useExamsData";

const AceEditor = dynamic(import("react-ace"), { ssr: false });
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddExam = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [order, setOrder] = useState(0);
  const [hasStarterCode, setHasStarterCode] = useState(false);
  const [hasExam, setHasExam] = useState(false);
  const [starterCode, setStartedCode] = useState("");
  const [diffLevel, setDiffLevel] = useState("easy");
  const {
    data: tagsData,
    error: tagsError,
    isLoading: isTagsLoading,
  } = useTagsData();
  const { data: examsList } = useExamsData();
  const [testCases, setTestCases] = useState([
    { id: 0, input: "", output: "", explaination: "", isPublic: false },
  ]);

  const selectedExam = useRef(null);
  const [selectedTags, setSelectedTags] = useState<IProblemTag[]>([]);

  const router = useRouter();

  const toast = useToast();
  const submit = async () => {
    const payload = {
      title,
      description: desc,
      difficulty: diffLevel,
      testCases,
      tags: selectedTags.map((tag) => tag.id),
      order,
      starterCode,
    };

    if (hasExam) payload["examId"] = +selectedExam.current.value;

    try {
      const res = await axios.post("/problems", payload);
      toast({
        title: "Problem created!",
        status: "success",
        description: "New Problem has been created.",
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

  return (
    <>
      <AdminLayout>
        <Container maxW={"8xl"} overflowY="scroll">
          <Stack>
            <Heading
              textAlign={"left"}
              fontWeight={"extrabold"}
              fontSize={"4xl"}
              m={10}
            >
              Create a problem!
            </Heading>
            <HStack>
              <FormControl mr="5%">
                <FormLabel htmlFor="title" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input
                  id="title"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>
              <FormControl mr="5%">
                <FormLabel htmlFor="slug" fontWeight={"normal"}>
                  Slug
                </FormLabel>
                <Input
                  id="slug"
                  placeholder="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
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
              <FormLabel htmlFor="description" fontWeight={"normal"}>
                Description
              </FormLabel>
              <Box bg="white" color={"black"}>
                <QuillNoSSRWrapper
                  theme="snow"
                  id="description"
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
            </FormControl>
            <SimpleGrid columns={2} spacing={10} mt={"2%"}>
              <Box>
                <FormControl mt={"2%"} display="flex" alignItems="center">
                  <Checkbox
                    id="has-starter-code"
                    isChecked={hasStarterCode}
                    onChange={() => setHasStarterCode((p) => !p)}
                  />
                  <FormLabel htmlFor="has-starter-code" mb="0" ml={2}>
                    has a starter code?
                  </FormLabel>
                </FormControl>
                {hasStarterCode && (
                  <AceEditor
                    placeholder="starter code here"
                    width="100%"
                    mode="python"
                    theme="dracula"
                    fontSize={22}
                    showPrintMargin={true}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={starterCode}
                    onChange={(newValue) => setStartedCode(newValue)}
                  />
                )}
              </Box>
              <Box>
                <FormControl mt={"2%"} display="flex" alignItems="center">
                  <Checkbox
                    id="has-exam"
                    isChecked={hasExam}
                    onChange={() => setHasExam((p) => !p)}
                  />
                  <FormLabel htmlFor="has-exam" mb="0" ml={2}>
                    belongs to an exam?
                  </FormLabel>
                </FormControl>
                {hasExam && (
                  <HStack>
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
                    <FormControl mt="2%">
                      <FormLabel htmlFor="order" fontWeight={"normal"}>
                        order
                      </FormLabel>
                      <Input
                        id="order"
                        placeholder="Order"
                        value={order}
                        onChange={(e) => setOrder(+e.target.value)}
                      />
                    </FormControl>
                  </HStack>
                )}
              </Box>
            </SimpleGrid>
            <Box>
              <Text fontSize={"xl"}>Tags: </Text>
              <Flex my={2}>
                <Text>Selected: </Text>
                <Text ml={2} fontWeight={"bold"}>
                  {JSON.stringify(selectedTags.map((tag) => tag.name))}
                </Text>
              </Flex>
              <Flex wrap={"wrap"} justifyContent={"space-between"}>
                {tagsData?.tags.map((tag) => (
                  <Tag
                    m={1}
                    key={tag.id}
                    size={"lg"}
                    borderRadius="full"
                    onClick={() => {
                      if (selectedTags.find((sTag) => sTag.id == tag.id)) {
                        setSelectedTags((p) =>
                          p.filter((t) => t.id !== tag.id)
                        );
                      } else {
                        setSelectedTags((p) => [...p, tag]);
                      }
                    }}
                    bg={
                      selectedTags.find((sTag) => sTag.id === tag.id)
                        ? "green"
                        : "gray.900"
                    }
                    cursor={"pointer"}
                  >
                    <TagLabel>{tag.name}</TagLabel>
                    {selectedTags.find((sTag) => sTag.id === tag.id) && (
                      <TagCloseButton />
                    )}
                  </Tag>
                ))}
              </Flex>
            </Box>
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
          </Stack>
        </Container>
      </AdminLayout>
    </>
  );
};

export default AddExam;

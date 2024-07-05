import React, { useEffect, useReducer, useRef, useState } from "react";
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
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import TestCaseRow from "../../_components/admin/TestCaseRow";
import axios from "../../lib/axios";
import { useTagsData } from "../../hooks/useProblemsData";
import { useExamsData } from "../../hooks/useExamsData";
import { IProblemTag, IStarterCode } from "../../types";
import { INITIAL_STARTER_CODES } from "../../data/starterCodeData";

const StarterCodeEditor = dynamic(
  () => import("../../_components/StarterCodeEditor"),
  { ssr: false }
);

const QuillNoSSRWrapper = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

type IAction = { type: string; payload: IStarterCode };

const starterCodesReducer = (
  state: IStarterCode[],
  action: IAction
): IStarterCode[] => {
  if (action.type === "INPUT") {
    return state.map((starterCode) =>
      starterCode.lang === action.payload.lang ? action.payload : starterCode
    );
  }
  return state;
};

const AddProblemPage = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [order, setOrder] = useState(0);
  const [frontendProblemId, setFrontendProblemId] = useState(0);
  const [hasStarterCodes, setHasStarterCodes] = useState(true);
  const [hasExam, setHasExam] = useState(false);

  const [starterCodes, dispatchStarterCodes] = useReducer(
    starterCodesReducer,
    INITIAL_STARTER_CODES
  );

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

  const selectedExam = useRef<HTMLSelectElement>(null);
  const [selectedTags, setSelectedTags] = useState<IProblemTag[]>([]);

  const router = useRouter();

  const beforeunload = (e) => {
    console.log("called unload");
    e.preventDefault();
    return (e.returnValue = "");
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!title && !slug && !desc && !diffLevel && !testCases && !selectedTags) {
      removeEventListener("beforeunload", beforeunload);
      console.log("removed event listener");
    } else {
      addEventListener("beforeunload", beforeunload);
      addEventListener("unload", beforeunload);
      console.log("added event listener");
    }
  }, [title, slug, desc, diffLevel, testCases, selectedTags]);

  const toast = useToast();
  const submit = async () => {
    const payload = {
      title,
      description: desc,
      difficulty: diffLevel,
      testCases,
      slug,
      frontendProblemId,
      tags: selectedTags.map((tag) => tag.id),
      order,
      starterCodes,
    };

    if (hasExam) {
      payload["examId"] = selectedExam.current
        ? +selectedExam.current.value
        : undefined;
      payload["frontendProblemId"] = 0;
    }

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
              {!hasExam && (
                <FormControl mr="5%">
                  <FormLabel htmlFor="problem-id" fontWeight={"normal"}>
                    Frontend Problem ID
                  </FormLabel>
                  <Input
                    id="problem-id"
                    placeholder="problem id"
                    value={frontendProblemId}
                    onChange={(e) => setFrontendProblemId(+e.target.value)}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel htmlFor="difficulty">Difficulty</FormLabel>
                <Select
                  id="difficulty"
                  defaultValue={"easy"}
                  onChange={(e) => setDiffLevel(e.target.value)}
                >
                  <option value="tutorial">Tutorial</option>
                  <option value="basic">Basic</option>
                  <option value="veryEasy">Very Easy</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">hard</option>
                </Select>
              </FormControl>
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
                      [
                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "blockquote",
                        "script",
                      ],
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
            <Grid templateColumns={"repeat(3, 1fr)"} mt={"2%"} w={"%"}>
              <GridItem colSpan={2}>
                <FormControl mt={"2%"} display="flex" alignItems="center">
                  <Checkbox
                    id="has-starter-code"
                    isChecked={hasStarterCodes}
                    onChange={() => setHasStarterCodes((p) => !p)}
                  />
                  <FormLabel htmlFor="has-starter-code" mb="0" ml={2}>
                    has a starter code?
                  </FormLabel>
                </FormControl>
                {hasStarterCodes && (
                  <>
                    <Tabs>
                      <TabList>
                        {INITIAL_STARTER_CODES.map((initCode) => (
                          <Tab key={initCode.lang}>{initCode.langLabel}</Tab>
                        ))}
                      </TabList>
                      <TabPanels>
                        {INITIAL_STARTER_CODES.map((initCode) => (
                          <TabPanel key={initCode.lang}>
                            <StarterCodeEditor
                              theme="dracula"
                              fontSize={18}
                              lang={initCode.lang}
                              code={
                                starterCodes.find(
                                  (sc) => sc.lang === initCode.lang
                                )?.code || ""
                              }
                              setCode={(newCode) => {
                                dispatchStarterCodes({
                                  type: "INPUT",
                                  payload: {
                                    langLabel: initCode.langLabel,
                                    lang: initCode.lang,
                                    code: newCode,
                                  },
                                });
                              }}
                            />
                          </TabPanel>
                        ))}
                      </TabPanels>
                    </Tabs>
                  </>
                )}
              </GridItem>
              <GridItem colSpan={1}>
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
                        {examsList &&
                          examsList.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {`${exam.title} - /contests/${exam.slug}`}
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
              </GridItem>
            </Grid>
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
                      <Th>Frontend Input</Th>
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

export default AddProblemPage;

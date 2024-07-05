// @ts-nocheck
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

import { useEffect, useReducer, useRef, useState } from "react";
import axios from "../../lib/axios";
import TestCaseRow from "./TestCaseRow";
import { useTagsData } from "../../hooks/useProblemsData";
import { IProblem, IStarterCode, Testcase } from "../../types";
import { INITIAL_STARTER_CODES } from "../../data/starterCodeData";

const Quill = dynamic(() => import("./QuillEditor"), { ssr: false });
const StarterCodeEditor = dynamic(
  () => import("../StarterCodeEditor"),
  { ssr: false }
);
type IAction = { type: string; payload: IStarterCode };

const starterCodesReducer = (
  state: IStarterCode[],
  action: IAction
): IStarterCode[] => {
  if (action.type === "INPUT") {
    return state.map((starterCode) =>
      starterCode.lang === action.payload.lang
        ? { ...starterCode, code: action.payload.code }
        : starterCode
    );
  }
  return state;
};

function ProblemEditor({
  isOpen,
  onClose,
  problemData,
  onEditSuccess,
  examsList,
}) {
  const {
    title,
    description,
    difficulty,
    isActive,
    examId,
    order,
    testCases,
    starterCodes,
    slug,
    frontendProblemId,
    tags,
  } = problemData as IProblem;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [newOrder, setNewOrder] = useState<number>();
  const [newTitle, setNewTitle] = useState<string>();
  const [newSlug, setNewSlug] = useState<string>();
  const [newFrontendProblemId, setNewFrontendProblemId] = useState<number>();
  const [newHasExam, setNewHasExam] = useState<boolean>();
  const [newIsActive, setNewIsActive] = useState<boolean>();
  const [newDifficulty, setNewDifficulty] = useState<string>();
  const [newDescription, setNewDescription] = useState<string>();
  const [newTestCases, setNewTestCases] = useState<Testcase[]>();
  const [newHasStarterCode, setNewHasStarterCode] = useState<boolean>();
  const [newStarterCodes, dispatchStarterCodes]: [
    IStarterCode[],
    (action: IAction) => void
  ] = useReducer(
    starterCodesReducer,
    starterCodes.length > 0 ? starterCodes : INITIAL_STARTER_CODES
  );
  if (frontendProblemId === 6) {
  }

  // const [newStarterCode, setNewStartedCode] = useState(starterCode);
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([]);

  const selectedExamRef = useRef(null);
  const quillRef = useRef(null);

  const toast = useToast();
  const {
    data: tagsData,
    error: tagsError,
    isLoading: isTagsLoading,
  } = useTagsData();

  useEffect(() => {
    console.log(quillRef.current);
  }, []);

  useEffect(() => {
    setNewOrder(order);
    setNewTitle(title);
    setNewSlug(slug);
    setNewIsActive(isActive);
    setNewDifficulty(difficulty);
    setNewDescription(description.replace(/\\n/g, " ") || "");
    setNewTestCases(testCases);
    setNewFrontendProblemId(frontendProblemId || -1);
    setNewSelectedTags(tags);
    setNewHasExam(!!examId);
    setNewHasStarterCode(starterCodes.length > 0);
  }, [
    description,
    difficulty,
    examId,
    frontendProblemId,
    isActive,
    order,
    problemData,
    slug,
    starterCodes.length,
    tags,
    testCases,
    title,
  ]);

  const updateProblem = async () => {
    setIsLoading(true);
    const payload = {
      title: newTitle,
      description: newDescription,
      difficulty: newDifficulty,
      testCases: newTestCases,
      slug: newSlug,
      frontendProblemId: newFrontendProblemId,
      isActive: newIsActive,
      tags: newSelectedTags.map((tag) => {
        return {
          id: tag.id,
          name: tag.name,
        };
      }),
      order: +newOrder,
      starterCodes: newStarterCodes,
    };
    if (newHasExam) {
      payload["examId"] = +selectedExamRef.current.value;
      payload["frontendProblemId"] = undefined;
    }
    try {
      const res = await axios.patch(`/problems/${problemData.id}`, payload);
      setIsLoading(false);
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
      setIsLoading(false);
      toast({
        title: "Error",
        status: "error",
        description: "Something went wrong",
        duration: 9000,
        isClosable: true,
      });
    }
  };
  if (!problemData || !examsList || !newTitle || !newDescription || !newSlug)
    return (
      <Box>
        <Spinner />
      </Box>
    );
  return (
    <Modal onClose={onClose} size={"6xl"} isOpen={isOpen}>
      <ModalOverlay backdropFilter="auto" backdropBlur="2px" />
      <ModalContent>
        <ModalHeader>Edit Problem</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
              <FormLabel htmlFor="slug">Slug</FormLabel>
              <Input
                id="slug"
                placeholder="Slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </FormControl>
            {!newHasExam && (
              <FormControl>
                <FormLabel htmlFor="problem-id">Frontend Problem Id</FormLabel>
                <Input
                  id="problem-id"
                  placeholder="frontend problem id"
                  value={newFrontendProblemId}
                  type="number"
                  onChange={(e) => setNewFrontendProblemId(+e.target.value)}
                />
              </FormControl>
            )}
            <FormControl>
              <FormLabel htmlFor="difficulty">Difficulty</FormLabel>
              <Select
                id="difficulty"
                defaultValue={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
              >
                <option value="starter">Starter</option>
                <option value="basic">Basic</option>
                <option value="veryEasy">Very Easy</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">hard</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="is-active">Active</FormLabel>
              <Switch
                id="is-active"
                colorScheme="purple"
                isChecked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
              />
            </FormControl>
          </HStack>
          <FormControl my={3}>
            <FormLabel htmlFor="desc">Description</FormLabel>

            <Box bg="white" color={"black"} borderRadius={10}>
              <Quill
                newDescription={newDescription}
                setNewDescription={setNewDescription}
              />
              {/* <QuillNoSSRWrapper
                style={{ borderRadius: 10 }}
                theme="snow"
                ref={(el) => {
                  quillRef.current = el;
                  console.log(el);
                }}
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
              /> */}
            </Box>
          </FormControl>

          <Box>
            <FormControl mt={"2%"} display="flex" alignItems="center">
              <Checkbox
                id="has-starter-code"
                isChecked={newHasStarterCode}
                onChange={() => setNewHasStarterCode((p) => !p)}
              />
              <FormLabel htmlFor="has-starter-code" mb="0" ml={2}>
                has a starter code?
              </FormLabel>
            </FormControl>
            {newHasStarterCode && (
              <Tabs variant={"line"}>
                <TabList>
                  {newStarterCodes.map((sc) => (
                    <Tab key={sc.lang}>{sc.lang}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {newStarterCodes.map((sc) => (
                    <TabPanel key={sc.lang}>
                      <StarterCodeEditor
                        theme="dracula"
                        lang={sc.lang}
                        fontSize={18}
                        code={
                          newStarterCodes.find((sc2) => sc2.lang === sc.lang)
                            ?.code || ""
                        }
                        setCode={(newCode) => {
                          dispatchStarterCodes({
                            type: "INPUT",
                            payload: {
                              langLabel: sc.langLabel,
                              lang: sc.lang,
                              code: newCode,
                            },
                          });
                        }}
                      />
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            )}
          </Box>
          <Box>
            <FormControl mt={"2%"} display="flex" alignItems="center">
              <Checkbox
                id="has-exam"
                isChecked={newHasExam}
                onChange={() => setNewHasExam((p) => !p)}
              />
              <FormLabel htmlFor="has-exam" mb="0" ml={2}>
                belongs to an exam?
              </FormLabel>
            </FormControl>
            {newHasExam && (
              <HStack>
                <FormControl mt="2%">
                  <FormLabel htmlFor="email" fontWeight={"normal"}>
                    Select Exam
                  </FormLabel>
                  <Select ref={selectedExamRef}>
                    {examsList.map((exam) => (
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
                    value={newOrder}
                    onChange={(e) => setNewOrder(+e.target.value)}
                  />
                </FormControl>
              </HStack>
            )}
          </Box>
          {/* ----------------TAGS SELECTION---------------- */}
          <Box>
            <Text fontSize={"xl"}>Tags: </Text>
            <Flex my={2}>
              <Text>Selected: </Text>
              <Text ml={2} fontWeight={"bold"}>
                {JSON.stringify(newSelectedTags.map((tag) => tag.name))}
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
                    if (newSelectedTags.find((sTag) => sTag.id == tag.id)) {
                      setNewSelectedTags((p) =>
                        p.filter((t) => t.id !== tag.id)
                      );
                    } else {
                      setNewSelectedTags((p) => [...p, tag]);
                    }
                  }}
                  bg={
                    newSelectedTags.find((sTag) => sTag.id === tag.id)
                      ? "green"
                      : "gray.900"
                  }
                  cursor={"pointer"}
                >
                  <TagLabel>{tag.name}</TagLabel>
                  {newSelectedTags.find((sTag) => sTag.id === tag.id) && (
                    <TagCloseButton />
                  )}
                </Tag>
              ))}
            </Flex>
          </Box>
          {/* ----------------TEST CASES ---------------- */}
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
                  {newTestCases?.map((testCase, index) => (
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
            <Button
              bg="purple.500"
              onClick={updateProblem}
              isLoading={isLoading}
            >
              Update
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ProblemEditor;

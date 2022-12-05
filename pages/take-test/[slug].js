import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Skeleton,
  Stack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import Split from "react-split";

import ToolBar from "../../components/ToolBar";
import CodeEditor from "../../components/CodeEditor";
import OutputViewer from "../../components/OutputViewer";
import ProblemStatement from "../../components/ProblemStatement";
import LeftProblemsList from "../../components/LeftProblemsList";
import MainLayout from "../../layout/MainLayout";
import { userContext } from "../../contexts/userContext";
import axios from "../../utils/axios";
import { useRouter } from "next/router";

function TakeTest() {
  const { user } = useContext(userContext);

  const [code, setCode] = useState(`a = input()
  b = input()
  
  print(b, a)`);
  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblemId, setCurrentProblemId] = useState(2);

  const [problems, setProblems] = useState([]);

  const [examData, setExamData] = useState(null);

  const router = useRouter();
  const { query } = router;
  const fetchData = useCallback(async () => {
    try {
      if (!query.slug) return;

      let res = await axios.get(`/exams/slug/${router.query.slug}`);
      setExamData(res.data);
      res = await axios.get("/problems/examProblems/" + res.data.id);
      setProblems(res.data);
    } catch (error) {
      console.log("error", error);
      router.push("/home");
    }
  }, [router]);
  useEffect(() => {
    fetchData();
  }, [router.query.slug, fetchData]);

  const {
    isOpen: isAlertOpen,
    onOpen,
    onClose: onAlertClose,
  } = useDisclosure();

  const cancelRef = useRef();

  const toast = useToast();
  const runCode = async () => {
    setIsLoading(true);
    console.log(problems[currentProblemId]);
    const payload = {
      code,
      lang,
      problemId: problems[currentProblemId].id - 1,
    };
    try {
      const res = await axios.post("/runCode", payload);
      // console.log(res.data);
      setOutput(res.data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      toast({
        title: "Error",
        description: "Something went wrong",
        status: "error",
        duration: 9000,
        isClosable: true,
      });

      setOutput({ error: "Somehings fishy :thinking_face:" });
    }
  };

  return (
    <MainLayout>
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            problems={problems}
            currentProblemId={currentProblemId}
            setCurrentProblemId={setCurrentProblemId}
          />
        </Flex>
        {problems.length === 0 ? (
          <Skeleton height="100vh" />
        ) : (
          <Flex flexGrow={1}>
            <Split
              className="split"
              minSize={450}
              style={{ height: "100%", width: "100%" }}
            >
              <ProblemStatement problem={problems[currentProblemId - 1]} />
              <Flex direction={"column"} width="100%" px={2}>
                <ToolBar
                  isLoading={isLoading}
                  runCode={runCode}
                  lang={lang}
                  theme={theme}
                  setLang={setLang}
                  setTheme={setTheme}
                />
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  lang={lang}
                  theme={theme}
                  runCode={runCode}
                />
                <Flex
                  flexGrow={1}
                  width="100%"
                  height={"100%"}
                  overflowY="scroll"
                >
                  {isLoading && (
                    <Stack bg="gray.800" h="100%">
                      <Skeleton
                        height="20px"
                        fadeDuration={1}
                        isLoaded={!isLoading}
                      />
                      <Skeleton
                        height="20px"
                        fadeDuration={3}
                        isLoaded={!isLoading}
                      />
                      <Skeleton
                        height="20px"
                        fadeDuration={5}
                        isLoaded={!isLoading}
                      />
                    </Stack>
                  )}
                  {!isLoading && (
                    <Box w={"100%"} overflowY="hidden">
                      <OutputViewer output={output} theme={theme} />
                    </Box>
                  )}
                </Flex>
              </Flex>
            </Split>
          </Flex>
        )}
        <AlertDialog
          isOpen={isAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                MASTERRRRRRRRRRRR
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure? You cant undo this action afterwards.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onAlertClose} mr={4}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={onAlertClose}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Flex>
    </MainLayout>
  );
}

export default TakeTest;

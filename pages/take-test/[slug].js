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
import { useRouter } from "next/router";

import Split from "react-split";
import axios from "../../utils/axios";

import ToolBar from "../../components/ToolBar";
import CodeEditor from "../../components/CodeEditor";
import OutputViewer from "../../components/OutputViewer";
import ProblemStatement from "../../components/ProblemStatement";
import LeftProblemsList from "../../components/LeftProblemsList";
import MainLayout from "../../layout/MainLayout";
import SubmissionModal from "../../components/modals/Submission";

import { submissionsContext } from "../../contexts/submissionsContext";
import BottomActions from "../../components/BottomActions";
import NewConsole from "../../components/NewConsole";

function TakeTest() {
  const { refreshSubmissions } = useContext(submissionsContext);

  const [code, setCode] = useState("");
  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(2);
  const [lastSubmissionPassed, setLastSubmissionPassed] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  const [problems, setProblems] = useState([]);

  const [examData, setExamData] = useState(null);

  const router = useRouter();
  const { query } = router;

  useEffect(() => {
    setCode(
      localStorage.getItem(`code ${examData?.id} ${currentProblemIdx}`) || ""
    );
    setShowConsole(false);
    setOutput({});
  }, [currentProblemIdx]);

  useEffect(() => {
    localStorage.setItem(`code ${examData?.id} ${currentProblemIdx}`, code);
  }, [code, currentProblemIdx]);

  const fetchData = useCallback(async () => {
    try {
      if (!query.slug) return;

      let res = await axios.get(`/exams/slug/${router.query.slug}`);
      setExamData(res.data);
      refreshSubmissions(res.data.id);
      res = await axios.get("/problems/examProblems/" + res.data.id);
      setProblems(res.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.log("error", error);
      router.push("/home");
    }
  }, [router]);

  useEffect(() => {
    fetchData();

    setTimeout(() => {
      setCurrentProblemIdx(1);
    }, 1000);
  }, [router.query.slug, fetchData]);

  const {
    isOpen: isAlertOpen,
    onOpen,
    onClose: onAlertClose,
  } = useDisclosure();

  const {
    isOpen: isSubmissionModalOpen,
    onOpen: onSubmissionModalOpen,
    onClose: onSubmissionModalClose,
  } = useDisclosure();
  const cancelRef = useRef();

  const toast = useToast();
  const runCode = async (submit = false) => {
    setIsLoading(true);
    setShowConsole(true);
    const payload = {
      code,
      lang,
      submit,
      problemId: problems[currentProblemIdx - 1].id,
      examId: examData.id,
    };
    try {
      const res = await axios.post("/runCode", payload);
      if (submit) {
        refreshSubmissions(examData?.id);
        setLastSubmissionPassed(res.data.isCorrect);
        onSubmissionModalOpen();
      }
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

      // setOutput({ error: "Somehings fishy :thinking_face:" });
    }
  };

  return (
    <MainLayout>
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            problems={problems}
            currentProblemIdx={currentProblemIdx}
            setCurrentProblemIdx={setCurrentProblemIdx}
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
              <ProblemStatement problem={problems[currentProblemIdx - 1]} />
              <Flex direction={"column"} width="100%" px={2}>
                <ToolBar
                  isLoading={isLoading}
                  runCode={runCode}
                  lang={lang}
                  theme={theme}
                  setLang={setLang}
                  setTheme={setTheme}
                />
                <Flex flexGrow={1} width="100%" height={"100%"}>
                  <CodeEditor
                    code={code}
                    setCode={setCode}
                    lang={lang}
                    theme={theme}
                    runCode={() => runCode(false)}
                  />
                </Flex>
                <Flex direction="column">
                  <Flex flexGrow={1}>
                    {showConsole && <NewConsole output={output} />}
                  </Flex>
                  <BottomActions
                    setShowConsole={setShowConsole}
                    showConsole={showConsole}
                    runCode={runCode}
                    isLoading={isLoading}
                  />
                </Flex>
                {/* <Flex
                  flexGrow={1}
                  width="100%"
                  height={"100%"}
                  overflowY="hidden"
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
                  {!isLoading && <OutputViewer output={output} theme={theme} />}
                </Flex> */}
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
        <SubmissionModal
          onClose={() => {
            setLastSubmissionPassed(false);
            onSubmissionModalClose();
          }}
          onOpen={onSubmissionModalOpen}
          isOpen={isSubmissionModalOpen}
          passed={lastSubmissionPassed}
          setCurrentProblemIdx={setCurrentProblemIdx}
          canGoToNextProblem={currentProblemIdx < problems.length}
        />
      </Flex>
    </MainLayout>
  );
}

export default TakeTest;

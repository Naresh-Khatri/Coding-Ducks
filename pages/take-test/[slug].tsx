import React, { useContext, useEffect, useRef, useState } from "react";
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
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import Split from "react-split";
import axios from "../../utils/axios";

import ToolBar from "../../components/ToolBar";
import CodeEditor from "../../components/CodeEditor";
import ProblemStatement from "../../components/ProblemStatement";
import LeftProblemsList from "../../components/LeftProblemsList";
import MainLayout from "../../layout/MainLayout";
import SubmissionModal from "../../components/modals/Submission";

import { submissionsContext } from "../../contexts/submissionsContext";
import BottomActions from "../../components/BottomActions";
import NewConsole from "../../components/NewConsole";
import { useExamData, useExamProblemsData } from "../../hooks/useExamsData";

interface Output {
  isCorrect: boolean;
  passedCount: number;
  totalCount: number;
  results: {
    errorMessage?: string;
    errorOccured?: boolean;
    actualOutput?: string;
    output?: string;
    isCorrect?: boolean;
    input?: string;
    result?: {
      cpuUsage: number;
      memoryUsage: number;
      exitCode: number;
      signal: any;
      stderr: string;
      stdout: string;
    };
  };
}

function TakeTest() {
  const { refreshSubmissions } = useContext(submissionsContext);
  const router = useRouter();
  const { slug } = router.query;
  const {
    data: examData,
    refetch: refetchExamData,
    isError: examDataError,
  } = useExamData(slug as string);
  const {
    data: problemsData,
    refetch: refetchProblemsData,
    isLoading: problemsDataLoading,
    isError: problemsDataError,
  } = useExamProblemsData({
    examId: examData?.data.id as number,
    enabled: !!examData?.data.id,
  });

  const [code, setCode] = useState("");
  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");
  const [output, setOutput] = useState<Output>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(2);
  const [lastSubmissionPassed, setLastSubmissionPassed] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    if (examDataError || problemsDataError) {
      router.push("/home");
    }
    if (router.isReady && slug) {
      refetchExamData();
      refreshSubmissions(examData?.data.id);
      refetchProblemsData();
      setCurrentProblemIdx(1);
    }
  }, [router.isReady, router.query, slug, examDataError, problemsDataError]);
  useEffect(() => {
    setCode(
      localStorage.getItem(`code ${examData?.data.id} ${currentProblemIdx}`) ||
        ""
    );
    setShowConsole(false);
    setOutput(null);
  }, [currentProblemIdx, examData?.data.id]);

  useEffect(() => {
    localStorage.setItem(
      `code ${examData?.data.id} ${currentProblemIdx}`,
      code
    );
  }, [code, currentProblemIdx]);

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
      problemId: problemsData.data[currentProblemIdx - 1].id,
      examId: examData?.data.id,
    };
    try {
      const res = await axios.post("/runCode", payload);
      if (submit) {
        refreshSubmissions(examData?.data.id);
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

  if (!examData || problemsDataLoading) return <div>Loading...</div>;
  return (
    <MainLayout title={examData ? examData.data?.title : "Unknown test"}>
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            problems={problemsData?.data}
            currentProblemIdx={currentProblemIdx}
            setCurrentProblemIdx={setCurrentProblemIdx}
          />
        </Flex>
        {problemsDataLoading || problemsData.data.length === 0 ? (
          <Skeleton height="100vh" />
        ) : (
          <Flex flexGrow={1}>
            <Split
              className="split-h"
              minSize={300}
              style={{ height: "100%", width: "100%" }}
            >
              <ProblemStatement
                problem={problemsData.data[currentProblemIdx - 1]}
              />
              <Flex
                direction={"column"}
                justify="space-between"
                width="100%"
                px={2}
              >
                <Flex justify={"end"}>
                  <ToolBar
                    isLoading={isLoading}
                    runCode={runCode}
                    lang={lang}
                    theme={theme}
                    setLang={setLang}
                    setTheme={setTheme}
                  />
                </Flex>
                <Flex flexGrow={1} direction="column" h={"45"}>
                  <Flex flexGrow={1} overflow="auto">
                    <CodeEditor
                      code={code}
                      setCode={setCode}
                      lang={lang}
                      theme={theme}
                      runCode={() => runCode(false)}
                    />
                  </Flex>
                  <Flex w={"full"}>
                    {showConsole && (
                      <Box overflow={"auto"} w={"full"}>
                        <NewConsole output={output} />
                      </Box>
                    )}
                  </Flex>
                </Flex>
                <Flex h={"50px"}>
                  <BottomActions
                    showConsole={showConsole}
                    setShowConsole={setShowConsole}
                    runCode={runCode}
                    isLoading={isLoading}
                  />
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
        <SubmissionModal
          onClose={() => {
            setLastSubmissionPassed(false);
            onSubmissionModalClose();
          }}
          isOpen={isSubmissionModalOpen}
          passed={lastSubmissionPassed}
          setCurrentProblemIdx={setCurrentProblemIdx}
          canGoToNextProblem={currentProblemIdx < problemsData.data.length}
        />
      </Flex>
    </MainLayout>
  );
}

export default TakeTest;

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Skeleton, useDisclosure, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";

import Split from "react-split";
import axios from "../../utils/axios";

import ToolBar from "../../components/ToolBar";
import CodeEditor from "../../components/CodeEditor";
import ProblemStatement from "../../components/ProblemStatement";
import LeftProblemsList from "../../components/LeftProblemsList";
import MainLayout from "../../layout/MainLayout";
import SubmissionModal from "../../components/modals/Submission";

import BottomActions from "../../components/BottomActions";
import NewConsole from "../../components/NewConsole";
import {
  useExamData,
  useExamProblemsData,
  useExamSubmissionsData,
} from "../../hooks/useExamsData";
import { useLastSubmissionData } from "../../hooks/useUsersData";
import WarnOnTabLeave from "../../components/WarnOnTabLeave";
import ConfirmModal from "../../components/modals/ConfirmModal";

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
  const router = useRouter();
  const { slug } = router.query;
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");
  const [output, setOutput] = useState<Output>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(1);
  const [lastSubmissionPassed, setLastSubmissionPassed] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  const toast = useToast();

  const {
    data: examData,
    refetch: refetchExamData,
    isLoading: examDataLoading,
    isError: examDataError,
  } = useExamData(slug as string);

  const {
    data: problemsData,
    refetch: refetchProblemsData,
    isLoading: problemsDataLoading,
    isError: problemsDataIsError,
    error: problemsDataError,
  } = useExamProblemsData({ examId: examData?.data?.id as number });

  const {
    isOpen: isSubmissionModalOpen,
    onOpen: onSubmissionModalOpen,
    onClose: onSubmissionModalClose,
  } = useDisclosure();

  const {
    isOpen: isCodeResetModalOpen,
    onOpen: onCodeResetModalOpen,
    onClose: onCodeResetModalClose,
  } = useDisclosure();

  const {
    isOpen: isCodeRetrievalModalOpen,
    onOpen: onCodeRetrievalModalOpen,
    onClose: onCodeRetrievalModalClose,
  } = useDisclosure();
  const onCodeRetriveSuccess = async (lastSubmission) => {
    try {
      if (lastSubmission?.data?.code) setCode(lastSubmission?.data?.code);
      onCodeRetrievalModalClose();
      if (!!lastSubmission?.data)
        toast({
          title: "Code Retrieved",
          description: "Your code has been retrieved successfully",
          position: "top",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      else
        toast({
          title: "No Code Found",
          description: "No code found for this problem",
          position: "top",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
    } catch (err) {
      console.log(err);
      onCodeRetrievalModalClose();
    }
  };
  const onCodeReset = () => {
    setCode(problemsData?.data[currentProblemIdx - 1].starterCode || "");
    toast({
      title: "Code Reset",
      description: "Your code has been reset successfully",
      position: "top",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    onCodeResetModalClose();
  };
  // this custom hook works on onSuccess only.
  const {
    refetch: refrechLastSubmission,
    isLoading: lastSubmissionIsLoading,
    fetchStatus: lastSubmissionFetchStatus,
  } = useLastSubmissionData(
    problemsData?.data[currentProblemIdx - 1]?.id,
    onCodeRetriveSuccess
  );

  const { data: submissionData, refetch: refetchSubmissionData } =
    useExamSubmissionsData(examData?.data?.id as number);
  const redirectIfDontHaveAccess = useCallback(() => {
    if (!problemsData && problemsDataIsError) {
      toast({
        title: "Exam Not Found",
        description: "The exam you are trying to access does not exist",
        position: "top",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/home");
    }
  }, [problemsData, problemsDataIsError, router, toast]);

  const redirectIfExamNotStarted = useCallback(() => {
    if (!examData?.data) return;
    const { data } = examData;
    const { isBounded, startTime } = data;
    const sTime = new Date(startTime);
    const curr = new Date();

    if (isBounded && sTime.getTime() > curr.getTime()) {
      toast({
        title: "Exam Not Started",
        description: "The exam has not started yet",
        position: "top",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/home");
    } else {
    }
  }, [examData, router, toast]);
  useEffect(() => {
    if (!!!examData) {
      refetchExamData();
    }
    if (!!examData && !!!problemsData) {
      refetchProblemsData();
    }
    redirectIfDontHaveAccess();
    redirectIfExamNotStarted();
  }, [
    examData,
    problemsData,
    refetchExamData,
    refetchProblemsData,
    examDataLoading,
    problemsDataLoading,
    redirectIfExamNotStarted,
    redirectIfDontHaveAccess,
    problemsDataIsError,
  ]);
  useEffect(() => {
    if (!problemsData) return;
    setCode(
      localStorage.getItem(`code ${examData?.data?.id} ${currentProblemIdx}`) ||
        problemsData?.data[currentProblemIdx - 1]?.starterCode ||
        ""
    );
    setShowConsole(false);
    setOutput(null);
  }, [currentProblemIdx, examData?.data?.id, problemsData]);

  useEffect(() => {
    if (code.trim().length === 0) return;
    localStorage.setItem(
      `code ${examData?.data?.id} ${currentProblemIdx}`,
      code
    );
  }, [code, examData?.data, currentProblemIdx]);

  const handleOnCodeRetrive = async () => {
    refrechLastSubmission();
  };

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
        // TODO: refresh submissions
        refetchSubmissionData();
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
    }
  };

  if (!examData || problemsDataLoading) return <div>Loading...</div>;
  return (
    <MainLayout
      title={examData ? examData.data?.title : "Unknown test"}
      examId={examData ? examData.data?.id : 2}
    >
      <WarnOnTabLeave />
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            examId={examData?.data.id}
            problems={problemsData?.data}
            currentProblemIdx={currentProblemIdx}
            setCurrentProblemIdx={setCurrentProblemIdx}
          />
        </Flex>
        {problemsDataLoading || problemsData?.data.length === 0 ? (
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
                    onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
                    onCodeReset={onCodeResetModalOpen}
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
        <ConfirmModal
          onClose={onCodeResetModalClose}
          isOpen={isCodeResetModalOpen}
          onConfirm={onCodeReset}
        >
          This will replace your current code with the default code.
        </ConfirmModal>
        <ConfirmModal
          onClose={onCodeRetrievalModalClose}
          isOpen={isCodeRetrievalModalOpen}
          onConfirm={handleOnCodeRetrive}
          isLoading={
            lastSubmissionIsLoading && lastSubmissionFetchStatus !== "idle"
          }
        >
          This will replace your current code with the code from your last
          submission.
        </ConfirmModal>
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

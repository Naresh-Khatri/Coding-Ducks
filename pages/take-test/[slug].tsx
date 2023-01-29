import React, { useEffect, useRef, useState } from "react";
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
import { useExamData, useExamProblemsData } from "../../hooks/useExamsData";
import ConfirmCodeRetrievalModel from "../../components/modals/ConfirmCodeRetrievalModal";
import { useLastSubmissionData } from "../../hooks/useUsersData";

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
  const [currentProblemIdx, setCurrentProblemIdx] = useState(2);
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
    isError: problemsDataError,
  } = useExamProblemsData({ examId: examData?.data?.id as number });

  const onCodeRetriveSuccess = async (lastSubmission) => {
    try {
      setCode(lastSubmission?.data?.code || "");
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
  // this custom hook works on onSuccess only.
  const {
    refetch: refrechLastSubmission,
    isLoading: lastSubmissionIsLoading,
    fetchStatus: lastSubmissionFetchStatus,
  } = useLastSubmissionData(
    problemsData?.data[currentProblemIdx - 1]?.id,
    onCodeRetriveSuccess
  );

  useEffect(() => {
    if (!!!examData) {
      refetchExamData();
    }
    if (!!examData && !!!problemsData) {
      refetchProblemsData();
    }
  }, [
    examData,
    problemsData,
    refetchExamData,
    refetchProblemsData,
    examDataLoading,
    problemsDataLoading,
  ]);
  useEffect(() => {
    setCode(
      localStorage.getItem(`code ${examData?.data.id} ${currentProblemIdx}`) ||
        ""
    );
    setShowConsole(false);
    setOutput(null);
  }, [currentProblemIdx, examData?.data?.id]);

  useEffect(() => {
    localStorage.setItem(
      `code ${examData?.data?.id} ${currentProblemIdx}`,
      code
    );
  }, [code, examData?.data, currentProblemIdx]);

  const {
    isOpen: isSubmissionModalOpen,
    onOpen: onSubmissionModalOpen,
    onClose: onSubmissionModalClose,
  } = useDisclosure();

  const {
    isOpen: isCodeRetrievalModalOpen,
    onOpen: onCodeRetrievalModalOpen,
    onClose: onCodeRetrievalModalClose,
  } = useDisclosure();

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
        // refreshSubmissions(examData?.data.id);
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
    <MainLayout
      title={examData ? examData.data?.title : "Unknown test"}
      examId={examData ? examData.data?.id : 2}
    >
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            examId={examData?.data.id}
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
                    onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
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
        <ConfirmCodeRetrievalModel
          onClose={onCodeRetrievalModalClose}
          isOpen={isCodeRetrievalModalOpen}
          onConfirm={handleOnCodeRetrive}
          isLoading={
            lastSubmissionIsLoading && lastSubmissionFetchStatus !== "idle"
          }
        />
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

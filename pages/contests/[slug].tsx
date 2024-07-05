import React, { useCallback, useContext, useEffect, useState } from "react";
import { Box, Flex, Skeleton, useDisclosure, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";

import Split from "react-split";
import axios from "../../lib/axios";

import LeftProblemsList from "../../_components/LeftProblemsList";
import MainLayout from "../../layout/MainLayout";
import SubmissionModal from "../../_components/modals/Submission";

import {
  useExamData,
  useExamProblemsData,
  useExamSubmissionsData,
} from "../../hooks/useExamsData";
import { useLastSubmissionData } from "../../hooks/useSubmissionsData";
import WarnOnTabLeave from "../../_components/WarnOnTabLeave";
import ConfirmModal from "../../_components/modals/ConfirmModal";
import { Output } from "../../types";
import SetMeta from "../../_components/SEO/SetMeta";
import EditorSettingsProvider, {
  EditorSettingsContext,
} from "../../contexts/editorSettingsContext";
import { RightEditorContainer } from "../../_components/problem/EditorContainer";
import ProblemStatement from "../../_components/ProblemStatement";
import ProblemDeleteModle from "../../_components/admin/ProblemDeleteModal";

function TakeTest() {
  const router = useRouter();
  const { settings, code, setCode } = useContext(EditorSettingsContext);

  const { slug } = router.query;
  const { lang, theme } = settings;
  const [output, setOutput] = useState<Output | null>(null);
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
  } = useExamProblemsData({ examId: examData?.id as number });

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
    if (!problemsData) return;
    setCode(
      problemsData[currentProblemIdx - 1].starterCodes.find(
        (sc) => sc.lang === lang
      )?.code || ""
    );
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
  // const {
  //   refetch: refrechLastSubmission,
  //   isLoading: lastSubmissionIsLoading,
  //   fetchStatus: lastSubmissionFetchStatus,
  // } = useLastSubmissionData(
  //   problemsData ? problemsData[currentProblemIdx - 1].order : 0,
  //   onCodeRetriveSuccess
  // );

  const { data: submissionData, refetch: refetchSubmissionData } =
    useExamSubmissionsData(examData?.id as number);
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
      router.push("/exams");
    }
  }, [problemsData, problemsDataIsError, router, toast]);

  const redirectIfExamNotStarted = useCallback(() => {
    if (!examData) return;
    const { isBounded, startTime } = examData;
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
      router.push("/exams");
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
      localStorage.getItem(`code ${examData?.id} ${currentProblemIdx}`) ||
        problemsData[currentProblemIdx - 1]?.starterCode ||
        ""
    );
    setShowConsole(false);
    setOutput(null);
  }, [currentProblemIdx, examData?.id, problemsData]);

  useEffect(() => {
    if (code.trim().length === 0) return;
    localStorage.setItem(`code ${examData?.id} ${currentProblemIdx}`, code);
  }, [code, examData, currentProblemIdx]);

  // const handleOnCodeRetrive = async () => {
  //   refrechLastSubmission();
  // };

  const runCode = async (submit = false) => {
    if (!problemsData || !examData) return;
    setIsLoading(true);
    setShowConsole(true);
    const payload = {
      code,
      lang,
      submit,
      problemId: problemsData[currentProblemIdx - 1].id,
      examId: examData.id,
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

  if (!examData || problemsDataLoading || !problemsData)
    return <div>Loading...</div>;
  return (
    <MainLayout examData={examData}>
      <SetMeta
        title={`Coding Ducks - ${examData?.title} - Coding Exam Solutions`}
        description={`Access the solutions for the ${examData?.title} coding exam on Coding Ducks. Review the problem statements and improve your coding techniques in Python, JavaScript, C++, or Java.`}
        keywords={`${examData?.title}, coding exam, solution, Python, JavaScript, C++, Java`}
        url={`https://codingducks.xyz/${examData?.slug}`}
      />
      {examData?.warnOnBlur && <WarnOnTabLeave />}
      <Flex w={"100vw"} direction="row">
        <Flex>
          <LeftProblemsList
            examId={examData.id}
            problems={problemsData}
            currentProblemIdx={currentProblemIdx}
            setCurrentProblemIdx={setCurrentProblemIdx}
          />
        </Flex>
        {problemsDataLoading || problemsData?.length === 0 ? (
          <Skeleton height="100vh" />
        ) : (
          <Flex flexGrow={1}>
            <Split
              className="split-h"
              minSize={300}
              style={{ height: "100%", width: "100%" }}
            >
              <ProblemStatement problem={problemsData[currentProblemIdx - 1]} />
              <RightEditorContainer
                isLoading={isLoading}
                runCode={runCode}
                problemData={problemsData[currentProblemIdx - 1]}
                onCodeResetModalOpen={onCodeResetModalOpen}
                onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
                output={output}
                showConsole={showConsole}
                setShowConsole={setShowConsole}
                lang={lang}
              />
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
        {/* <ConfirmModal
          onClose={onCodeRetrievalModalClose}
          isOpen={isCodeRetrievalModalOpen}
          onConfirm={handleOnCodeRetrive}
          isLoading={
            lastSubmissionIsLoading && lastSubmissionFetchStatus !== "idle"
          }
        >
          This will replace your current code with the code from your last
          submission.
        </ConfirmModal> */}
        <SubmissionModal
          onClose={() => {
            setLastSubmissionPassed(false);
            onSubmissionModalClose();
          }}
          isOpen={isSubmissionModalOpen}
          passed={lastSubmissionPassed}
          setCurrentProblemIdx={setCurrentProblemIdx}
          canGoToNextProblem={currentProblemIdx < problemsData.length}
        />
      </Flex>
    </MainLayout>
  );
}
// We cant use context directly so this wrappers helps
function ContestPageWrapper() {
  return (
    <EditorSettingsProvider>
      <TakeTest />
    </EditorSettingsProvider>
  );
}

export default ContestPageWrapper;

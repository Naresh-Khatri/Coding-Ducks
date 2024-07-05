import React, { useContext, useEffect, useState } from "react";
import {
  Flex,
  Skeleton,
  useDisclosure,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";

import Split from "react-split";
import axios from "../../lib/axios";

import { useLastSubmissionDataV2 } from "../../hooks/useSubmissionsData";
import ConfirmModal from "../../_components/modals/ConfirmModal";
import { useProblemData } from "../../hooks/useProblemsData";
import ProblemLayout from "../../layout/ProblemLayout";
import { Output } from "../../types";
import LeftTabsContainer from "../../_components/problem/LeftTabsContainer";
import ViewSubmissionModal from "../../_components/problem/ViewSubmissionModal";
import { SUBMISSION_TAB_INDEX } from "../../lib/utils";
import EditorSettingsProvider, {
  EditorSettingsContext,
} from "../../contexts/editorSettingsContext";
import UserUpgradeModal from "../../_components/problem/UserUpgradeModal";
import { userContext } from "../../contexts/userContext";
import {
  BottomEditorContainer,
  RightEditorContainer,
} from "../../_components/problem/EditorContainer";
import SetMeta from "../../_components/SEO/SetMeta";

function ProblemPage() {
  const { loadUser } = useContext(userContext);
  const { settings, code, setCode } = useContext(EditorSettingsContext);
  const { lang } = settings;

  const router = useRouter();
  const { slug } = router.query;
  const [output, setOutput] = useState<Output | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [submittedSubId, setSubmittedSubId] = useState<number>(0);

  const [tabIndex, setTabIndex] = useState(0);

  const toast = useToast();

  const [isLessThan800] = useMediaQuery("(max-width: 800px)", {
    ssr: true,
    fallback: false, // return false on the server, and re-evaluate on the client side
  });

  const {
    data: problemData,
    refetch: refetchProblemData,
    isLoading: problemDataLoading,
    isError: problemDataIsError,
  } = useProblemData({ slug: slug as string });

  const {
    isOpen: isCodeResetModalOpen,
    onOpen: onCodeResetModalOpen,
    onClose: onCodeResetModalClose,
  } = useDisclosure();

  const {
    isOpen: isUserUpgradeModalOpen,
    onOpen: onUserUpgradeModalOpen,
    onClose: onUserUpgradeModalClose,
  } = useDisclosure();
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

  const onCodeRetrievalSuccess = async (lastSubmission) => {
    try {
      if (lastSubmission?.data?.code) setCode(lastSubmission?.data?.code);

      onCodeRetrievalModalClose();
      toast({
        title: "Code Retrieved",
        description: "Your code has been retrieved successfully",
        position: "top",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err);
      onCodeRetrievalModalClose();
    }
  };
  const onCodeRetrievalError = async () => {
    toast({
      title: "No Code Found",
      description: "No code found for this problem",
      position: "top",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    onCodeRetrievalModalClose();
  };

  const onCodeReset = () => {
    setCode(
      (problemData &&
        problemData.starterCodes.find((sc) => sc.lang === lang)?.code) ||
        ""
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
  const {
    refetch: refetchLastSubmissionData,
    isLoading: lastSubmissionIsLoading,
    fetchStatus: lastSubmissionFetchStatus,
  } = useLastSubmissionDataV2(
    problemData ? problemData?.id : 0,
    lang,
    onCodeRetrievalSuccess,
    onCodeRetrievalError
  );

  const runCode = async (submit = false) => {
    // onUserUpgradeModalOpen()
    setIsLoading(true);
    setShowConsole(true);
    setOutput(null);
    const payload = {
      code,
      lang,
      submit,
      problemId: problemData && problemData.id,
    };
    try {
      const res = await axios.post("/runCode", payload);
      // console.log(res.data);
      if (submit) {
        setTabIndex(SUBMISSION_TAB_INDEX);
        setSubmittedSubId(res.data.submissionId);
        onSubmissionModalOpen();

        if (res?.data?.tutorialProblemsSolved === 10) {
          toast({
            title: "Congratulations!",
            description: "You have solved all tutorial problems",
            position: "top",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          onUserUpgradeModalOpen();
          loadUser();
        } else if (res.data.isCorrect)
          toast({
            title: "Code Accepted",
            description: "Your code has been accepted successfully",
            position: "top",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        else
          toast({
            title: "Code Rejected",
            description: "Please check the console for more details",
            position: "top",
            status: "error",
            duration: 5000,
            isClosable: true,
          });

        // TODO: refresh submissions
        // refetchSubmissionData();
        // setLastSubmissionPassed(res.data.isCorrect);
        // onSubmissionModalOpen();
      }
      setOutput(res.data);
      // console.log(res.data);
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

  if (problemDataLoading || !problemData?.title) return <div>Loading...</div>;
  return (
    <ProblemLayout>
      <SetMeta
        title={` ${problemData.title} - Coding Ducks `}
        description={`Get the solution for the ${problemData.title} coding problem on Coding Ducks. Solve the challenge using Python, JavaScript, C++, or Java and improve your coding skills.`}
        keywords={`${problemData.title}, coding problem, solution, Python, JavaScript, C++, Java`}
        url={`https://www.codingducks.xyz/problems/${problemData.slug}`}
      />
      <Flex w={"100vw"} direction="row">
        {problemDataLoading ? (
          <Skeleton height="100vh" />
        ) : !isLessThan800 ? (
          <Flex flexGrow={1}>
            <Split
              className="split-h"
              minSize={300}
              style={{ height: "100%", width: "100%" }}
            >
              <LeftTabsContainer
                problemData={problemData}
                tabIndex={tabIndex}
                setTabIndex={setTabIndex}
              />
              <RightEditorContainer
                isLoading={isLoading}
                runCode={runCode}
                problemData={problemData}
                onCodeResetModalOpen={onCodeResetModalOpen}
                onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
                output={output}
                showConsole={showConsole}
                setShowConsole={setShowConsole}
                lang={lang}
              />
            </Split>
          </Flex>
        ) : (
          <Flex direction={"column"} w={"100%"} position={"relative"}>
            <LeftTabsContainer
              problemData={problemData}
              tabIndex={tabIndex}
              setTabIndex={setTabIndex}
            />
            <BottomEditorContainer
              isLoading={isLoading}
              runCode={runCode}
              problemData={problemData}
              onCodeResetModalOpen={onCodeResetModalOpen}
              onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
              output={output}
              showConsole={showConsole}
              setShowConsole={setShowConsole}
              lang={lang}
            />
          </Flex>
        )}
        {isSubmissionModalOpen && (
          <ViewSubmissionModal
            isOpen={isSubmissionModalOpen}
            onClose={onSubmissionModalClose}
            submissionId={submittedSubId}
          />
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
          onConfirm={refetchLastSubmissionData}
          isLoading={
            lastSubmissionIsLoading && lastSubmissionFetchStatus !== "idle"
          }
        >
          This will replace your current code with the code from your last
          submission.
        </ConfirmModal>
        {isUserUpgradeModalOpen && (
          <UserUpgradeModal
            isOpen={isUserUpgradeModalOpen}
            onClose={onUserUpgradeModalClose}
          />
        )}
      </Flex>
    </ProblemLayout>
  );
}

// We cant use context directly so this wrappers helps
function ProblemPageWrapper() {
  return (
    <EditorSettingsProvider>
      <ProblemPage />
    </EditorSettingsProvider>
  );
}

export default ProblemPageWrapper;

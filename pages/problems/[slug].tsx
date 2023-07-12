import React, { useContext, useEffect, useState } from "react";
import { Box, Flex, Skeleton, useDisclosure, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import Split from "react-split";
import axios from "../../lib/axios";

import ToolBar from "../../components/ToolBar";

import BottomActions from "../../components/BottomActions";
import NewConsole from "../../components/NewConsole";
import { useLastSubmissionDataV2 } from "../../hooks/useSubmissionsData";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { useProblemData } from "../../hooks/useProblemsData";
import ProblemLayout from "../../layout/ProblemLayout";
import { Output } from "../../types";
import LeftTabsContainer from "../../components/problem/LeftTabsContainer";
import ViewSubmissionModal from "../../components/problem/ViewSubmissionModal";
import { SUBMISSION_TAB_INDEX } from "../../lib/utils";
import EditorSettingsProvider, {
  EditorSettingsContext,
} from "../../contexts/editorSettingsContext";
import UserUpgradeModal from "../../components/problem/UserUpgradeModal";
import { userContext } from "../../contexts/userContext";

const AceCodeEditor = dynamic(() => import("../../components/AceCodeEditor"), {
  ssr: false,
});

function ProblemPage() {
  const { loadUser } = useContext(userContext);
  const { settings, code, setCode } = useContext(EditorSettingsContext);
  const { lang } = settings;

  const router = useRouter();
  const { slug } = router.query;
  const [output, setOutput] = useState<Output>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [submittedSubId, setSubmittedSubId] = useState<number>(0);

  const [tabIndex, setTabIndex] = useState(0);

  const toast = useToast();

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
      problemData.starterCodes.find((sc) => sc.lang === lang)?.code || ""
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
    problemData?.id,
    lang,
    onCodeRetrievalSuccess,
    onCodeRetrievalError
  );

  // const handleOnCodeRetrive = async () => {
  //   refetchLastSubmissionData();
  // };

  const runCode = async (submit = false) => {
    // onUserUpgradeModalOpen()
    setIsLoading(true);
    setShowConsole(true);
    const payload = {
      code,
      lang,
      submit,
      problemId: problemData.id,
    };
    try {
      const res = await axios.post("/runCode", payload);
      console.log(res.data);
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
      console.log(res.data);
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
      <Flex w={"100vw"} direction="row">
        {problemDataLoading ? (
          <Skeleton height="100vh" />
        ) : (
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
                    onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
                    onCodeReset={onCodeResetModalOpen}
                  />
                </Flex>
                <Flex flexGrow={1} direction="column" h={"45"}>
                  <Flex flexGrow={1} overflow="auto">
                    <AceCodeEditor
                      problemId={problemData.id}
                      starterCode={
                        problemData.starterCodes.find((sc) => sc.lang === lang)
                          ?.code
                      }
                      errorIndex={output?.results[0]?.errorIndex || 0}
                      runCode={() => runCode(false)}
                    />
                  </Flex>
                  <Flex w={"full"}>
                    {showConsole && (
                      <Box overflow={"auto"} w={"full"}>
                        <NewConsole
                          output={output}
                          onClose={() => {
                            setShowConsole(false);
                          }}
                        />
                      </Box>
                    )}
                  </Flex>
                </Flex>
                <Flex h={"50px"}>
                  <BottomActions
                    isTutorialProblem={problemData.difficulty === "tutorial"}
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

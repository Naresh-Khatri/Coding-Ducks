import React, { useEffect, useRef, useState } from "react";
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

import ToolBar from "../components/ToolBar";
import CodeEditor from "../components/CodeEditor";
import OutputViewer from "../components/OutputViewer";
import ProblemStatement from "../components/ProblemStatement";
import LeftProblemsList from "../components/LeftProblemsList";
import MainLayout from "../layout/MainLayout";

function TakeTest() {
  const [code, setCode] = useState("print('hi mom!')");
  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblemId, setCurrentProblemId] = useState(8);

  const [problems, setProblems] = useState([]);
  useEffect(() => {
    fetch("https://coding_ducks.panipuri.tech/problems")
    // fetch("http://localhost:4000/problems")
      .then((res) => res.json())
      .then((data) => {
        setProblems(data);
      });
  }, []);

  const {
    isOpen: isAlertOpen,
    onOpen,
    onClose: onAlertClose,
  } = useDisclosure();

  const cancelRef = useRef();

  const toast = useToast();
  const runCode = async () => {
    setIsLoading(true);
    const payload = { code, lang };
    try {
      console.log("running code");
      // const res = await fetch("https://coding_ducks.panipuri.tech/runCode", {
      const res = await fetch("http://localhost:3333/runCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log(data);
      setOutput(data);
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
              <ProblemStatement problem={problems[currentProblemId]} />
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
                <Flex flexGrow={1} width="100%" height={"100%"}>
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
                    <Box w={"100%"}>
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

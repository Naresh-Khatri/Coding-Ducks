import { Box, Button, Flex } from "@chakra-ui/react";
import React, { useContext, useRef, useState } from "react";
import ToolBar from "../ToolBar";
import NewConsole from "../NewConsole";
import BottomActions from "../BottomActions";
import dynamic from "next/dynamic";
import { IProblem, Lang, Output } from "../../types";
import Sheet, { SheetRef } from "react-modal-sheet";
import { EditorSettingsContext } from "../../contexts/editorSettingsContext";

const { Container, Content, Backdrop, Header } = Sheet;

const AceCodeEditor = dynamic(() => import("../AceCodeEditor"), {
  ssr: false,
});

interface RightEditorContainerProps {
  isLoading: boolean;
  runCode: (isSubmission?: boolean) => void;
  problemData: IProblem;
  onCodeRetrievalModalOpen: () => void;
  onCodeResetModalOpen: () => void;
  output: Output;
  showConsole: boolean;
  setShowConsole: (show: boolean) => void;
  lang: Lang;
}
function RightEditorContainer({
  isLoading,
  runCode,
  problemData,
  onCodeResetModalOpen,
  onCodeRetrievalModalOpen,
  output,
  showConsole,
  setShowConsole,
  lang,
}: RightEditorContainerProps) {
  return (
    <Flex direction={"column"} justify="space-between" width="100%" px={2}>
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
              problemData.starterCodes.find((sc) => sc.lang === lang)?.code
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
  );
}
interface BottomEditorContainerProps {
  isLoading: boolean;
  runCode: (isSubmission?: boolean) => void;
  problemData: IProblem;
  onCodeRetrievalModalOpen: () => void;
  onCodeResetModalOpen: () => void;
  output: Output;
  showConsole: boolean;
  setShowConsole: (show: boolean) => void;
  lang: Lang;
}
function BottomEditorContainer({
  isLoading,
  runCode,
  problemData,
  onCodeResetModalOpen,
  onCodeRetrievalModalOpen,
  output,
  showConsole,
  setShowConsole,
  lang,
}: BottomEditorContainerProps) {
  const { bottomSheetIsOpen, setBottomSheetIsOpen } = useContext(
    EditorSettingsContext
  );
  console.log(bottomSheetIsOpen);
  const ref = useRef<SheetRef>();
  const snapTo = (i: number) => ref.current?.snapTo(i);
  return (
    <>
      <Sheet
        ref={ref}
        isOpen={bottomSheetIsOpen}
        onClose={() => setBottomSheetIsOpen(false)}
        snapPoints={[700, 400, 100, 0]}
        initialSnap={0}
        onSnap={(snapIndex) =>
          console.log("> Current snap point index:", snapIndex)
        }
        tabIndex={1}
        style={{ zIndex: 0 }}
      >
        <Backdrop
          onTap={() => setBottomSheetIsOpen(false)}
          style={{ backdropFilter: "blur(2px)" }}
        />
        <Container style={{ background: "#1d1d1d", borderRadius: "10px" }}>
          <Content>
            <Flex w={"100vw"} justifyContent={"center"}>
              <Box
                borderRadius={10}
                m={2}
                h={"5px"}
                w={"70px"}
                bg={"whiteAlpha.500"}
              ></Box>
            </Flex>
            <Flex
              direction={"column"}
              // bg={"gray"}
              h={"100%"}
              borderRadius={10}
              justifyContent={"space-between"}
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
                    hideHeader
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
          </Content>
        </Container>
      </Sheet>
    </>
  );
}

export { RightEditorContainer, BottomEditorContainer };

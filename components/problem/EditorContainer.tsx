import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import ToolBar from "../ToolBar";
import NewConsole from "../NewConsole";
import BottomActions from "../BottomActions";
import dynamic from "next/dynamic";
import { IProblem, Lang, Output } from "../../types";
import Sheet, { SheetRef } from "react-modal-sheet";
import { EditorSettingsContext } from "../../contexts/editorSettingsContext";
import Split from "react-split";
import SplitComponent from "react-ace/lib/split";

const { Container, Content, Backdrop, Header } = Sheet;

const AceCodeEditor = dynamic(() => import("../editors/AceCodeEditor"), {
  ssr: false,
});

interface RightEditorContainerProps {
  isLoading: boolean;
  runCode: (isSubmission?: boolean) => void;
  problemData: IProblem;
  onCodeRetrievalModalOpen: () => void;
  onCodeResetModalOpen: () => void;
  output: Output | null;
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
  const splitRef = useRef<
    Split & {
      split: SplitComponent;
    }
  >(null);

  const translation = 6;
  const duration = 16;
  const [draging, setDraging] = useState(false);
  useEffect(() => {
    if (draging) return;
    const openAnimation = (counter: number) => {
      if (counter === 60) {
        return;
      }
      counter += translation;
      splitRef.current?.split?.setSizes([100 - counter, counter]);
      requestAnimationFrame(() => openAnimation(counter));
    };
    const closeAnimation = (counter: number) => {
      if (counter < 5) return;
      counter -= translation;
      splitRef.current?.split?.setSizes([100 - counter, counter]);
      requestAnimationFrame(() => closeAnimation(counter));
    };

    if (showConsole) {
      requestAnimationFrame(() => openAnimation(0));
    } else {
      let counter = splitRef.current && splitRef.current.split.getSizes()[1];
      requestAnimationFrame(() => closeAnimation(counter));
    }
  }, [showConsole]);

  return (
    <>
      <Flex direction={"column"}>
        <Flex justify={"end"} px={".4rem"}>
          <ToolBar
            isLoading={isLoading}
            runCode={runCode}
            onCodeRetrievalModalOpen={onCodeRetrievalModalOpen}
            onCodeReset={onCodeResetModalOpen}
          />
        </Flex>
        <Flex flex={1}>
          <Split
            ref={splitRef}
            className="split-v"
            minSize={0}
            style={{ height: "100%", width: "100%" }}
            onDragStart={() => {
              setDraging(true);
            }}
            onDragEnd={() => {
              setDraging(false);
            }}
            onDrag={(sizes) => {
              setShowConsole(sizes[1] > 10);
            }}
            direction="vertical"
          >
            <Flex w={"100%"} h={"100%"} direction={"column"} px={"0.4rem"}>
              <Flex direction="column" h={"100%"}>
                <Flex flex={1} overflow="auto">
                  <AceCodeEditor
                    allowPadding
                    problemId={problemData.id}
                    starterCode={
                      problemData.starterCodes.find((sc) => sc.lang === lang)
                        ?.code
                    }
                    // errorIndex={
                    //   (lang === "py" && output?.results[0]?.errorIndex) || 0
                    // }
                    runCode={() => runCode(false)}
                  />
                </Flex>
              </Flex>
            </Flex>
            <Flex w={"100%"} h={"100%"} direction={"column"}>
              {showConsole && (
                <NewConsole
                  output={output}
                  isLoading={isLoading}
                  onClose={() => {
                    setShowConsole(false);
                  }}
                />
              )}
            </Flex>
          </Split>
        </Flex>
        <Flex h={"3rem"} px={2}>
          <BottomActions
            isTutorialProblem={problemData.difficulty === "tutorial"}
            examId={problemData.examId}
            showConsole={showConsole}
            setShowConsole={setShowConsole}
            runCode={runCode}
            isLoading={isLoading}
          />
        </Flex>
      </Flex>
    </>
  );
}
interface BottomEditorContainerProps {
  isLoading: boolean;
  runCode: (isSubmission?: boolean) => void;
  problemData: IProblem;
  onCodeRetrievalModalOpen: () => void;
  onCodeResetModalOpen: () => void;
  output: Output | null;
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
                        isLoading={isLoading}
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

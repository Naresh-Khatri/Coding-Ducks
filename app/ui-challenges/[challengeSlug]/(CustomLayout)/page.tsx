"use client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Collapse,
  Flex,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Switch,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
} from "@chakra-ui/react";
import EditorSettingsModal from "_components/ducklets/EditorSettingsModal";
import LayoutSwitcher from "_components/ducklets/LayoutSwitcher";
import CMEditor from "_components/editors/CMEditor";
import FileIcons from "_components/multiplayer/FileIcons";
import { userContext } from "contexts/userContext";
import {
  useChallengeData,
  useMutateChallengeAttemptContents,
  useSubmitChallengeAttempt,
  useUserChallengeAttemptsData,
} from "hooks/useChallengesData";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  Dispatch,
  SetStateAction,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import Split from "react-split";

import { format } from "monocart-formatter";

import { useLayoutStore } from "stores";
import { IUIChallenge, IUIChallengeAttempt } from "types";

import SubmissionModal from "_components/ui-challenges/SubmissionModal";
import CodePreview, { getSrcDoc } from "_components/ui-challenges/CodePreview";
import { useStreamingFetch } from "lib/StreamingFetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Converter } from "showdown";

function UIChallengePage({ params }) {
  const { user, userLoaded } = use(userContext);
  const { challengeSlug } = params;
  const {
    data: challengeData,
    isLoading: challengeDataLoading,
    error: challengeDataError,
  } = useChallengeData(challengeSlug);

  const {
    data: attemptData,
    isLoading: attemptDataLoading,
    error: attemptDataError,
  } = useUserChallengeAttemptsData({
    challengeId: challengeData?.id,
    userId: user?.id,
  });
  const { mutate: updateAttempt, isLoading } =
    useMutateChallengeAttemptContents();

  // const {
  //   mutate: submitAttempt,
  //   isError: submitHasError,
  //   isLoading: isSubmitting,
  //   data: submitAttemptData,
  // } = useSubmitChallengeAttempt();

  const {
    isLoading: isSubmitting,
    error: submitError,
    data: submitAttemptData,
    streamingFetch,
  } = useStreamingFetch<{
    score?: number;
    stage?: number;
    data: IUIChallengeAttempt;
  }>();
  // console.log(submitAttemptData);

  const {
    isOpen: isSubmissionModalOpen,
    onClose: onSubmissionModalClose,
    onOpen: onSubmissionModalOpen,
  } = useDisclosure();

  const router = useRouter();
  const toast = useToast();
  const [isMobile] = useMediaQuery("(max-width: 650px)");

  const [contentHEAD, setContentHEAD] = useState("");
  const [contentHTML, setContentHTML] = useState("");
  const [contentCSS, setContentCSS] = useState("");
  const [contentJS, setContentJS] = useState("");
  const formatCode = async (lang: "html" | "css" | "js") => {
    console.log(lang);
    if (lang === "html") {
      const formatted = await format(contentHTML, "html");
      setContentHTML(formatted.content);
    } else if (lang === "css") {
      const formatted = await format(contentCSS, "css");
      setContentCSS(formatted.content);
    } else {
      const formatted = await format(contentJS, "js");
      setContentJS(formatted.content);
    }
  };

  useEffect(() => {
    if (!attemptData) return;
    setContentHEAD(attemptData?.contentHEAD);
    setContentHTML(attemptData?.contentHTML);
    setContentCSS(attemptData?.contentCSS);
    setContentJS(attemptData?.contentJS);
  }, [attemptData]);
  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      if (attemptData && attemptData.id)
        updateAttempt({
          challengeId: challengeData?.id || 0,
          attemptId: attemptData.id,
          contents: {
            head: contentHEAD,
            html: contentHTML,
            css: contentCSS,
            js: contentJS,
          },
        });
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [contentHEAD, contentHTML, contentCSS, contentJS]);

  if (userLoaded && !user) {
    toast({
      title: "Login Required",
      description: "Please login to continue",
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
    return router.push(`/login?from=ui-challenges/${challengeSlug}`);
  }
  if ((!attemptDataLoading && !attemptData) || attemptDataError) {
    router.push(`/ui-challenges/${challengeSlug}/submissions`);
    toast({
      title: "Error",
      description: "Start challenge first!",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }

  if (challengeDataLoading || attemptDataLoading) return <div>Loading...</div>;

  const handleSubmission = () => {
    if (!challengeData) {
      return;
    }

    onSubmissionModalOpen();
    streamingFetch({
      method: "POST",
      url: `/ui-challenges/${challengeData.id}/submit`,
      body: {
        contents: {
          head: contentHEAD,
          html: contentHTML,
          css: contentCSS,
          js: contentJS,
        },
      },
    });
  };
  return (
    <>
      <NavBar
        head={contentHEAD}
        setHead={setContentHEAD}
        isSyncing={isLoading}
        isSubmitting={isSubmitting}
        handleSubmission={handleSubmission}
        userSrcDoc={getHTML({ html: contentHTML, css: contentCSS })}
        targetSrcDoc={getHTML({ html: contentHTML, css: contentCSS })}
      />
      {isSubmissionModalOpen && (
        <SubmissionModal
          isLoading={isSubmitting}
          isOpen={isSubmissionModalOpen}
          onClose={onSubmissionModalClose}
          isMobile={isMobile}
          result={submitAttemptData}
          hasError={!!submitError}
        />
      )}

      {isMobile ? (
        <MobileView
          challenge={challengeData}
          state={{
            head: contentHEAD,
            html: contentHTML,
            css: contentCSS,
            js: contentJS,
            setHead: setContentHEAD,
            setHtml: setContentHTML,
            setCss: setContentCSS,
            setJs: setContentJS,
          }}
          formatCode={formatCode}
        />
      ) : (
        <DesktopView
          challenge={challengeData}
          state={{
            head: contentHEAD,
            html: contentHTML,
            css: contentCSS,
            js: contentJS,
            setHead: setContentHEAD,
            setHtml: setContentHTML,
            setCss: setContentCSS,
            setJs: setContentJS,
          }}
          formatCode={formatCode}
        />
      )}
    </>
  );
}

export default UIChallengePage;

const NavBar = ({
  head,
  setHead,
  isSyncing,
  handleSubmission,
  isSubmitting,
  userSrcDoc,
  targetSrcDoc,
}: {
  head: string;
  setHead: Dispatch<SetStateAction<string>>;
  isSyncing: boolean;
  handleSubmission: () => void;
  isSubmitting: boolean;
  userSrcDoc: string;
  targetSrcDoc: string;
}) => {
  const [isMobile] = useMediaQuery("(max-width: 650px)");
  const {
    isOpen: isEditorSettingsModalOpen,
    onOpen: onEditorSettingsModalOpen,
    onClose: onEditorSettingsModalClose,
  } = useDisclosure();
  const {
    isOpen: isAIHelpOpen,
    onClose: onAIHelpClose,
    onOpen: onAIHelpOpen,
  } = useDisclosure();
  return (
    <HStack
      h={"4rem"}
      w={"100vw"}
      px={"1rem"}
      justifyContent={"space-between"}
      position={"relative"}
    >
      <HStack>
        <Link href={"/ui-challenges"}>
          <Button variant={"outline"} leftIcon={<ChevronLeftIcon />}>
            <Text fontWeight={"bold"}>Back</Text>
          </Button>
        </Link>
      </HStack>
      <HStack>
        <Text>{isSyncing && "Syncing..."}</Text>
      </HStack>

      <HStack justifyContent={"end"} alignItems={"center"}>
        <Button
          colorScheme="purple"
          variant="outline"
          isLoading={isSubmitting}
          onClick={onAIHelpOpen}
        >
          AI help
        </Button>
        {!isMobile && <LayoutSwitcher />}

        <IconButton
          icon={<SettingsIcon />}
          aria-label="Settings"
          onClick={onEditorSettingsModalOpen}
        />

        {isEditorSettingsModalOpen && (
          <EditorSettingsModal
            isOpen={isEditorSettingsModalOpen}
            onClose={onEditorSettingsModalClose}
            onOpen={onEditorSettingsModalOpen}
            guestMode
            htmlHead={head}
            setHtmlHead={setHead}
          />
        )}
        {isAIHelpOpen && (
          <AIHelpModal
            isOpen={isAIHelpOpen}
            onClose={onAIHelpClose}
            targetSrcDoc={targetSrcDoc}
            userSrcDoc={userSrcDoc}
          />
        )}
        <Button
          colorScheme="purple"
          rightIcon={<ChevronRightIcon />}
          isLoading={isSubmitting}
          onClick={handleSubmission}
        >
          Submit
        </Button>
      </HStack>
    </HStack>
  );
};
const AIHelpModal = ({
  isOpen,
  onClose,
  targetSrcDoc,
  userSrcDoc,
}: {
  isOpen: boolean;
  onClose: () => void;
  targetSrcDoc: string;
  userSrcDoc: string;
}) => {
  const [response, setResponse] = useState("Thinking...");
  useEffect(() => {
    (async () => {
      const KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      // import { GoogleGenerativeAI } from "@google/generative-ai";
      const genAI = new GoogleGenerativeAI(KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze the Target Code:

${targetSrcDoc}

Your Task:
Recreate a similar UI component using your HTML and CSS skills.

Here are some tips to help you:

Understand the Structure:

Break down the target component into its basic HTML elements (e.g., divs, spans, etc.).
Pay attention to how these elements are nested and organized.
Analyze the Styling:

Identify the key CSS properties used to style the component.
Consider factors like colors, fonts, spacing, and layout.
Test and Refine:

Continuously test your code to ensure it matches the target design as closely as possible.
Use browser developer tools to inspect the target code and compare it to your own.
Here’s your current code:

${userSrcDoc}

Specific Feedback:

Layout: [Specific feedback on the layout, e.g., element positioning, spacing]
Styling: [Specific feedback on the styling, e.g., color usage, font choices]
Responsiveness: [Specific feedback on how the component adapts to different screen sizes]
Remember, the goal is to recreate the visual appearance and behavior of the target component. Don’t worry about replicating the exact code structure. Focus on the end result. AND KEEP YOUR RESPONVE VERY SHORT AND TELL THEM THEIR MISTAKES THATS IT!! `;

      const result = await model.generateContent(prompt);
      const converter = new Converter(),
        html = converter.makeHtml(result.response.text());

      setResponse(html);
    })();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Coding Ducks AI</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div dangerouslySetInnerHTML={{ __html: response }}></div>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
const MobileView = ({
  challenge,
  state,
  formatCode,
}: {
  challenge?: IUIChallenge;
  state: {
    head: string;
    html: string;
    css: string;
    js: string;
    setHead: Dispatch<SetStateAction<string>>;
    setHtml: Dispatch<SetStateAction<string>>;
    setCss: Dispatch<SetStateAction<string>>;
    setJs: Dispatch<SetStateAction<string>>;
  };
  formatCode: (lang: "html" | "css" | "js") => void;
}) => {
  return (
    <Split
      style={{ height: "calc(100dvh - 48px - 28px - 7px)", width: "100%" }}
      className={"split-v"}
      direction={"vertical"}
      minSize={200}
      sizes={[40, 60]}
    >
      <Box h={"100%"} pos={"relative"}>
        <Tabs position="relative" variant={"enclosed"} h={"100%"}>
          <TabList>
            <Tab>
              <FileIcons fileName="index.html" width={20} />{" "}
              <Text fontWeight={"bold"}>HTML</Text>
            </Tab>
            <Tab>
              <FileIcons fileName="style.css" width={20} />{" "}
              <Text fontWeight={"bold"}>CSS</Text>
            </Tab>
            <Tab>
              <FileIcons fileName="script.js" width={20} />{" "}
              <Text fontWeight={"bold"}>JS</Text>
            </Tab>
          </TabList>
          <TabIndicator
            mt="-1.5px"
            height="2px"
            bg="blue.500"
            borderRadius="1px"
          />
          <TabPanels h={"calc(100% - 39px)"}>
            <TabPanel p={0} h={"100%"}>
              <CMEditor
                value={state?.html}
                setValue={state?.setHtml}
                lang={"html"}
                onSave={formatCode}
              />
            </TabPanel>
            <TabPanel p={0} h={"100%"}>
              <CMEditor
                value={state?.css}
                setValue={state?.setCss}
                lang={"css"}
                onSave={formatCode}
              />
            </TabPanel>
            <TabPanel p={0} h={"100%"}>
              <CMEditor
                value={state.js}
                setValue={state.setJs}
                lang={"js"}
                onSave={formatCode}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      {/* <Box w={"full"} h={"full"} bg={"white"}>
        <iframe
          title="output"
          sandbox="allow-scripts"
          width={"100%"}
          height={"100%"}
          srcDoc={srcDoc}
        ></iframe>
      </Box> */}

      <CodePreview
        source={{
          head: state.head,
          html: state.html,
          css: state.css,
          js: state.js,
        }}
        target={{
          head: challenge?.contentHEAD,
          html: challenge?.contentHTML,
          css: challenge?.contentCSS,
          js: challenge?.contentJS,
        }}
      />
    </Split>
  );
};

const DesktopView = ({
  challenge,
  state,
  formatCode,
}: {
  challenge?: IUIChallenge;
  state: {
    head: string;
    html: string;
    css: string;
    js: string;
    setHead: Dispatch<SetStateAction<string>>;
    setHtml: Dispatch<SetStateAction<string>>;
    setCss: Dispatch<SetStateAction<string>>;
    setJs: Dispatch<SetStateAction<string>>;
  };
  formatCode: (lang: "html" | "css" | "js") => void;
}) => {
  const layout = useLayoutStore((state) => state.layout);

  // TODO: show rendered image of preview to prevent cheaters
  return (
    <Split
      key={layout}
      style={{ height: "calc(100dvh - 56px )", width: "100%" }}
      // since layout != split type
      className={
        layout === "vertical" || layout === "file" ? "split-h" : "split-v"
      }
      direction={
        layout === "vertical" || layout === "file" ? "horizontal" : "vertical"
      }
      minSize={200}
      sizes={[40, 60]}
      // onDrag={handleViewportChange}
    >
      {layout === "file" ? (
        <Box h={"100%"} position={"relative"}>
          <Tabs variant="enclosed" h={"100%"} w={"100%"} position={"absolute"}>
            <TabList>
              <Tab
                _selected={{
                  color: "purple.400",
                  fontWeight: "bold",
                  border: "1px solid #9F7AEA",
                }}
              >
                <HStack>
                  <FileIcons fileName={`index.html`} width={20} />
                  <Text>HTML</Text>
                </HStack>
              </Tab>
              <Tab
                _selected={{
                  color: "purple.400",
                  fontWeight: "bold",
                  border: "1px solid #9F7AEA",
                }}
              >
                <HStack>
                  <FileIcons fileName={`style.css`} width={20} />
                  <Text>CSS</Text>
                </HStack>
              </Tab>
              <Tab
                _selected={{
                  color: "purple.400",
                  fontWeight: "bold",
                  border: "1px solid #9F7AEA",
                }}
              >
                <HStack>
                  <FileIcons fileName={`script.js`} width={20} />
                  <Text>JS</Text>
                </HStack>
              </Tab>
            </TabList>
            <TabPanels h={"calc(100% - 37px)"}>
              <TabPanel height={"100%"} p={0}>
                <Flex flex={1} height={"100%"}>
                  <CMEditor
                    value={state.html}
                    setValue={state.setHtml}
                    lang={"html"}
                    onSave={formatCode}
                  />
                </Flex>
              </TabPanel>
              <TabPanel height={"100%"} p={0}>
                <Flex flex={1} height={"calc(100% - 30px)"}>
                  <CMEditor
                    value={state.css}
                    setValue={state.setCss}
                    lang={"css"}
                    onSave={formatCode}
                  />
                </Flex>
              </TabPanel>
              <TabPanel height={"100%"} p={0}>
                <Flex flex={1} height={"calc(100% - 20px)"}>
                  <CMEditor
                    value={state.js}
                    setValue={state.setJs}
                    lang={"js"}
                    onSave={formatCode}
                  />
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      ) : (
        <Box h={"100%"}>
          <Split
            className={layout === "horizontal" ? "split-h" : "split-v"}
            direction={layout === "horizontal" ? "horizontal" : "vertical"}
            minSize={20}
            snapOffset={50}
            style={{
              width: "100%",
              height: "100%",
              background: "#282A36 !important",
            }}
          >
            <Flex direction={"column"}>
              <HStack pl={"2rem"} bg={"#282A36"} borderRadius={"5px 5px 0 0"}>
                <FileIcons fileName={`index.html`} width={20} />
                <Text fontWeight={"bold"} textTransform={"uppercase"}>
                  HTML
                </Text>
              </HStack>
              <Flex flex={1}>
                <CMEditor
                  value={state.html}
                  setValue={state.setHtml}
                  lang={"html"}
                  onSave={formatCode}
                />
              </Flex>
            </Flex>
            <Flex direction={"column"}>
              <HStack pl={"2rem"} bg={"#282A36"} borderRadius={"5px 5px 0 0"}>
                <FileIcons fileName={`style.css`} width={20} />
                <Text fontWeight={"bold"} textTransform={"uppercase"}>
                  CSS
                </Text>
              </HStack>
              <Flex flex={1} height={"calc(100% - 30px)"}>
                <CMEditor
                  value={state.css}
                  setValue={state.setCss}
                  lang={"css"}
                  onSave={formatCode}
                />
              </Flex>
            </Flex>
            <Flex direction={"column"}>
              <HStack pl={"2rem"} bg={"#282A36"} borderRadius={"5px 5px 0 0"}>
                <FileIcons fileName={`script.js`} width={20} />
                <Text fontWeight={"bold"} textTransform={"uppercase"}>
                  JS
                </Text>
              </HStack>
              <Flex flex={1} height={"calc(100% - 20px)"}>
                <CMEditor
                  value={state.js}
                  setValue={state.setJs}
                  lang={"js"}
                  onSave={formatCode}
                />
              </Flex>
            </Flex>
          </Split>
        </Box>
      )}
      <CodePreview
        source={{
          head: state.head,
          html: state.html,
          css: state.css,
          js: state.js,
        }}
        target={{
          head: challenge?.contentHEAD,
          html: challenge?.contentHTML,
          css: challenge?.contentCSS,
          js: challenge?.contentJS,
        }}
      />
    </Split>
  );
};
const getHTML = ({ html, css }) => {
  return `<html>
    <style>${css}</style>
    <body>${html}</body>
</html>
`;
};

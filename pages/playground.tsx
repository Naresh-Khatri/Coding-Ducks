import { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import NormalLayout from "../layout/NormalLayout";
import axios from "../lib/axios";
import { faPlay, faShare } from "@fortawesome/free-solid-svg-icons";
import ToolBar from "../_components/ToolBar";
import { useRouter } from "next/router";
import SetMeta from "../_components/SEO/SetMeta";
import FAIcon from "../_components/FAIcon";
import EditorSettingsProvider, {
  EditorSettingsContext,
} from "../contexts/editorSettingsContext";
import dynamic from "next/dynamic";
import Split from "react-split";
import Link from "next/link";
import Image from "next/image";

import Convert from "ansi-to-html";

import UserProfile from "_components/UserProfile";
import { Lang } from "types";

const AceCodeEditor = dynamic(
  () => import("../_components/editors/AceCodeEditor"),
  {
    ssr: false,
  }
);

interface OutputType {
  stdout?: string;
  stderr?: string;
  error?: string;
}

function PlaygroundPage() {
  // const [output, setOutput] = useState<OutputType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [hasError, setHasError] = useState(false);
  const [runTime, setRunTime] = useState(0);
  const [memory, setMemory] = useState(0);
  const [input, setInput] = useState("");

  const { code } = useContext(EditorSettingsContext);
  // const { lang } = settings;
  const toast = useToast();
  const router = useRouter();
  const { lang } = router.query as { lang: Lang };

  useEffect(() => {
    if (!code) return;
    localStorage.setItem("playground-code-" + lang, code);
  }, [code]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!lang) router.push("?lang=py");
    // hack to replace empty code with starter code
    const pyCode = localStorage.getItem(`code--1-py`);
    const jsCode = localStorage.getItem(`code--1-js`);
    const cppCode = localStorage.getItem(`code--1-cpp`);
    const javaCode = localStorage.getItem(`code--1-java`);
    if (!pyCode || pyCode?.trim() === "") {
      localStorage.setItem(`code--1-py`, "print('hello world')");
    }
    if (!jsCode || jsCode?.trim() === "") {
      localStorage.setItem(`code--1-js`, "console.log('hello world')");
    }
    if (!cppCode || cppCode?.trim() === "") {
      localStorage.setItem(
        `code--1-cpp`,
        '#include <iostream>\n\nint main(){\n\tstd::cout << "hello world";\n\treturn 0;\n}'
      );
    }
    if (!javaCode || javaCode?.trim() === "") {
      localStorage.setItem(
        `code--1-java`,
        'public class Main{\n\tpublic static void main(String[] args){\n\t\tSystem.out.println("hello world");\n\t}\n}'
      );
    }
    const savedInputValue = localStorage.getItem("playground-input");
    if (savedInputValue) setInput(savedInputValue);
  }, [router.query, lang]);

  const handleOnInputTextChange = (e) => {
    setInput(e.target.value);
    localStorage.setItem("playground-input", e.target.value);
  };

  const { setValue, hasCopied, onCopy } = useClipboard("");
  const shareCode = () => {
    // console.log(`${router.pathname}?code=${code}&lang=${lang}`);
    setValue(
      `http://localhost:3000${router.pathname}?lang=${lang}&code=${code}`
    );
    onCopy();
  };

  const runCode = async () => {
    setIsLoading(true);
    setHasError(false);
    const payload = { code, lang, inputs: [input] };
    try {
      const { compiletTime, totalRuntime, memory, results, stderr } = (
        await axios.post("/playground", payload)
      ).data;
      setRunTime(+(+totalRuntime).toFixed(1));
      setMemory(0);

      setIsLoading(false);
      if (stderr || results[0]?.errorType) {
        setHasError(true);
        toast({
          title: "Error",
          description: "Something's wrong with your code!",
          status: "error",
        });
      }

      let output =
        stderr ||
        results[0]?.stderr ||
        results[0]?.stdout ||
        results[0]?.errorType;
      output = output?.replace(/\n/g, "<br />");
      setConsoleOutput(output);
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      console.log(error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.code === 401
            ? "Please login first!"
            : "Something went wrong",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <SetMeta
        title={`${
          lang === "js"
            ? "JavaScript"
            : lang === "cpp"
            ? "C++"
            : lang === "java"
            ? "Java"
            : "Python"
        } Compiler - Coding Ducks`}
        description="Practice coding in real-time with our interactive coding playground on Coding Ducks. Experiment, test, and refine your code in Python, JavaScript, C++, and Java."
        keywords="interactive coding playground, code testing, coding experimentation, Python, JavaScript, C++, Java"
        url="https://www.codingducks.xyz/playground"
      />
      <Flex
        w={"100vw"}
        h={"100dvh"}
        direction={"column"}
        px={{ base: 1, md: 3 }}
        pb={2}
      >
        <Flex px={2} w={"full"} justifyContent={"space-between"}>
          <Link href={"/"}>
            <Image
              src={
                "https://ik.imagekit.io/couponluxury/coding_ducks/tr:w-200/logo_E_BOxGUcc.png"
              }
              width={175}
              height={175}
              alt={"logo"}
              style={{ width: "100px" }}
            />
          </Link>
          <UserProfile />
        </Flex>
        <Flex w={"100%"} direction={"column"} position={"relative"}>
          <Flex justifyContent={"space-between"} gap={2}>
            <ToolBar />
            <HStack justify={"space-between"}>
              <HStack spacing={2}>
                <Button
                  colorScheme={"green"}
                  isLoading={isLoading}
                  onClick={runCode}
                  leftIcon={<FAIcon icon={faPlay} />}
                >
                  Run
                </Button>
                <Button
                  onClick={shareCode}
                  leftIcon={<FAIcon icon={faShare} />}
                >
                  Share
                </Button>
              </HStack>
            </HStack>
          </Flex>
        </Flex>
        <Flex flex={1} overflow={"hidden"}>
          <MobileView
            input={input}
            hasError={hasError}
            running={isLoading}
            consoleOutput={consoleOutput}
            setConsoleOutput={setConsoleOutput}
            handleOnInputTextChange={handleOnInputTextChange}
          />
          <DesktopView
            input={input}
            running={isLoading}
            hasError={hasError}
            consoleOutput={consoleOutput}
            setConsoleOutput={setConsoleOutput}
            handleOnInputTextChange={handleOnInputTextChange}
          />
          {consoleOutput && (
            <Box pos={"absolute"} bottom={0} right={0} p={2}>
              <Text fontSize={"md"}>Runtime: {runTime} ms</Text>{" "}
              <Text fontSize={"md"}> Memory: {memory} KB</Text>
            </Box>
          )}
        </Flex>
      </Flex>
    </>
  );
}

interface ViewProps {
  input: string;
  running: boolean;
  hasError: boolean;
  consoleOutput: string;
  setConsoleOutput: (output: string) => void;
  handleOnInputTextChange: (e) => void;
}
const MobileView = ({
  input,
  running,
  hasError,
  consoleOutput,
  setConsoleOutput,
  handleOnInputTextChange,
}: ViewProps) => {
  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      w={"100%"}
      h={"100%"}
      direction={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      gap={2}
    >
      <AceCodeEditor problemId={-1} hideHeader />
      <Flex
        borderRadius={"10px"}
        border={"1px solid rgba(255,255,255,.125)"}
        direction={"column"}
        w={"100%"}
        minH={32}
      >
        <HStack justifyContent={"space-between"}>
          <Text py={1} pl={6} fontWeight={"bold"}>
            Input
          </Text>
        </HStack>
        <Input
          value={input}
          onChange={handleOnInputTextChange}
          flex={1}
          bg={"#1d1d1d"}
          fontFamily={
            "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;"
          }
          focusBorderColor="none"
          borderRadius={"10px"}
          as={"textarea"}
          outline={"none"}
          border={"none"}
          type="text"
        />
      </Flex>
      <Flex
        borderRadius={"10px"}
        border={"1px solid rgba(255,255,255,.125)"}
        direction={"column"}
        w={"100%"}
        minH={32}
      >
        <HStack justifyContent={"space-between"}>
          <Text py={1} pl={6} fontWeight={"bold"}>
            Output
          </Text>
          {consoleOutput && (
            <Button variant={"ghost"} onClick={() => setConsoleOutput("")}>
              Clear
            </Button>
          )}
        </HStack>
        <Center h={"100%"} w={"100%"} overflowY={"auto"}>
          {running ? (
            <Spinner />
          ) : (
            <Box
              borderRadius={"10px"}
              flex={1}
              bg={"#1d1d1d"}
              as="pre"
              p={3}
              overflow={"auto"}
              color={hasError ? "red.300" : "white"}
              dangerouslySetInnerHTML={{
                __html: new Convert().toHtml(
                  consoleOutput?.replace(/\n/g, "<br />")
                ),
              }}
              w={"100%"}
              h={"100%"}
            ></Box>
          )}
        </Center>
      </Flex>
    </Flex>
  );
};
const DesktopView = ({
  input,
  running,
  hasError,
  consoleOutput,
  setConsoleOutput,
  handleOnInputTextChange,
}: ViewProps) => {
  return (
    <Flex
      display={{ base: "none", md: "flex" }}
      w={"100%"}
      h={"100%"}
      direction={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      gap={5}
    >
      <Split
        className="split-h"
        minSize={300}
        style={{ width: "100%", height: "100%" }}
      >
        <Flex
          w={"100%"}
          h={"100%"}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          fontSize={"5xl"}
        >
          <AceCodeEditor problemId={-1} hideHeader />
        </Flex>
        <Split
          className="split-v"
          minSize={100}
          style={{ height: "100%", width: "100%" }}
          sizes={[80, 20]}
          direction="vertical"
        >
          <Flex
            borderRadius={"10px"}
            border={"1px solid rgba(255,255,255,.125)"}
            direction={"column"}
          >
            <HStack justifyContent={"space-between"}>
              <Text py={1} pl={6} fontWeight={"bold"}>
                Output
              </Text>
              {consoleOutput && (
                <Button variant={"ghost"} onClick={() => setConsoleOutput("")}>
                  Clear
                </Button>
              )}
            </HStack>
            <Center h={"100%"} w={"100%"}>
              {running ? (
                <Spinner />
              ) : (
                <Box
                  h={"100%"}
                  maxH={"calc(100%-35px)"}
                  borderRadius={"10px"}
                  flex={1}
                  bg={"#1d1d1d"}
                  as="pre"
                  p={3}
                  overflow={"auto"}
                  color={hasError ? "red.300" : "white"}
                  dangerouslySetInnerHTML={{
                    __html: new Convert().toHtml(
                      consoleOutput?.replace(/\n/g, "<br />")
                    ),
                  }}
                  w={"100%"}
                ></Box>
              )}
            </Center>
          </Flex>
          <Flex
            borderRadius={"10px"}
            border={"1px solid rgba(255,255,255,.125)"}
            direction={"column"}
          >
            <HStack justifyContent={"space-between"}>
              <Text py={1} pl={6} fontWeight={"bold"}>
                Input:
              </Text>
            </HStack>
            <Input
              value={input}
              onChange={handleOnInputTextChange}
              flex={1}
              bg={"#1d1d1d"}
              fontFamily={
                "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;"
              }
              focusBorderColor="none"
              borderRadius={"10px"}
              as={"textarea"}
              outline={"none"}
              border={"none"}
              type="text"
            />
          </Flex>
        </Split>
      </Split>
    </Flex>
  );
};

const PlaygoundPageWrapper = () => {
  return (
    <EditorSettingsProvider>
      <PlaygroundPage />
    </EditorSettingsProvider>
  );
};

export default PlaygoundPageWrapper;

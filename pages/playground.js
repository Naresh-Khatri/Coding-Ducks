import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import CodeMirror from "@uiw/react-codemirror";
import { keymap } from "@codemirror/view";

import { dracula } from "@uiw/codemirror-theme-dracula";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { duotoneDark, duotoneLight } from "@uiw/codemirror-theme-duotone";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import NormalLayout from "../layout/NormalLayout";
import axios from "../utils/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faShare } from "@fortawesome/free-solid-svg-icons";
import ToolBar from "../components/ToolBar";

function Playground() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [runTime, setRunTime] = useState(0);
  const [memory, setMemory] = useState(0);

  const [lang, setLang] = useState("py");
  const [theme, setTheme] = useState("dracula");

  const toast = useToast();

  const supportedLangs = {
    py: python(),
    js: javascript(),
    cpp: cpp(),
    c: cpp(),
    java: java(),
  };
  const supportedThemes = {
    dracula: dracula,
    atomone: atomone,
    eclipse: eclipse,
    okaidia: okaidia,
    githubDark: githubDark,
    githubLight: githubLight,
    duotoneDark: duotoneDark,
    duotoneLight: duotoneLight,
    xcodeDark: xcodeDark,
    xcodeLight: xcodeLight,
  };
  const saveCode = () => {
    console.log("saving file");
  };
  useEffect(() => {
    if (!code) return;
    localStorage.setItem("playground-code", code);
  }, [code]);
  useEffect(() => {
    setCode(localStorage.getItem("playground-code") || print("Hello World"));
    setLang(localStorage.getItem("lang") || "py");
    setTheme(localStorage.getItem("theme") || "dracula");
  }, []);

  const shortcuts = [
    {
      key: "Ctrl-Enter",
      preventDefault: true,
      run: () => {
        runCode();
        return true;
      },
    },
    {
      key: "Ctrl-s",
      preventDefault: true,
      run: saveCode,
    },
  ];
  const save = (e) => {
    console.log("save", e);
  };
  const runCode = async () => {
    setIsLoading(true);
    const payload = { code, lang };
    try {
      const res = await axios.post("/playground", payload);
      console.log(res);
      setOutput(res.data);
      let output = res.data.stderr || res.data.stdout;
      output = output.replace(/\n/g, "<br />");
      setConsoleOutput(output);
      setRunTime(res.data.cpuUsage / 1000);
      setMemory(res.data.memoryUsage / (1024 * 1024));

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

  return (
    <NormalLayout>
      <Container maxW={"5xl"} minH={"100vh"}>
        <Box w={"100%"}>
          <Box w={"100%"} h={100}>
            <ToolBar
              runCode={runCode}
              isLoading={isLoading}
              lang={lang}
              setLang={setLang}
              theme={theme}
              setTheme={setTheme}
              saveBtnLoading={false}
            />
            {/*
            <HStack spacing={4}>
               <Box>
                <IconButton>
                  <FontAwesomeIcon icon={faBoxOpen} />
                </IconButton>
                <IconButton>
                  <FontAwesomeIcon icon={faSave} />
                </IconButton>
              </Box>
              <Box>

              </Box>
            </HStack> */}
            <Flex
              alignItems={"center"}
              bg={"#1d1d1d"}
              h={7}
              px={5}
              borderRadius="10px 10px 0 0"
            >
              <Text>main.py</Text>
            </Flex>
            <CodeMirror
              autoFocus
              value={code}
              height="60vh"
              style={{ fontSize: "1rem" }}
              theme={supportedThemes[theme]}
              extensions={[keymap.of(shortcuts), supportedLangs[lang]]}
              onChange={(value) => setCode(value)}
            />
            <HStack justify={"space-between"}>
              <HStack spacing={2}>
                <Button
                  colorScheme={"green"}
                  isLoading={isLoading}
                  onClick={runCode}
                  leftIcon={<FontAwesomeIcon icon={faPlay} />}
                >
                  Run
                </Button>
                <Button leftIcon={<FontAwesomeIcon icon={faShare} />}>
                  Share
                </Button>
              </HStack>
              <Box>
                <Text fontSize={"md"}>Runtime: {runTime.toFixed(0)} ms</Text>{" "}
                <Text fontSize={"md"}> Memory: {memory.toFixed(2)} MB</Text>
              </Box>
            </HStack>
            <Box
              bg={"#1d1d1d"}
              as="pre"
              p={3}
              overflow={"auto"}
              color={output.stderr ? "red.300" : "white"}
              dangerouslySetInnerHTML={{ __html: consoleOutput }}
              h={"100px"}
              resize
            ></Box>
          </Box>
        </Box>
      </Container>
    </NormalLayout>
  );
}

export default Playground;

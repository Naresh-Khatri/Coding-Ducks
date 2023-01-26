import CodeMirror from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { duotoneDark, duotoneLight } from "@uiw/codemirror-theme-duotone";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";
import { Box } from "@chakra-ui/react";
import WindowHeader from "./WindowHeader";
import { useEffect, useState } from "react";

export default function CodeEditor({ output, theme }) {
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
  const [outputText, setOutputText] = useState("");
  const [hasError, setHasError] = useState(false);

  const formatResult = (res) => {
    //check if any test case has error
    if (res.results?.some((r) => r.errorOccurred)) {
      //if any test case has error
      //find the first test case with error
      const firstError = res.results.find((result) => result.errorOccurred);
      //set the output text to the error message
      setOutputText(firstError.errorMessage);
      //set hasError to true
      setHasError(true);
      return;
    }

    setHasError(false);
    setOutputText(
      `tests passed: ${res.passedCount}/${res.totalCount} ${
        res.passedCount / res.totalCount === 1 ? "😎😍" : "😵"
      }\n\n`
    );
    res.results.forEach((test, index) => {
      setOutputText(
        (p) =>
          (p += `test #${index + 1}\ninput :\n${test.input}
Expected  output: \n${test.output}
Your code output: \n${test.actualOutput}\n${
            test.isCorrect ? "Passed ✅" : "Failed ❌"
          }\n----------------------------------------------\n\n`)
      );
    });
  };
  useEffect(() => {
    if (output) formatResult(output);
  }, [output]);
  // TODO: Turn text color red if error
  // useEffect(()=>{
  //   const container = document.querySelectorAll('.cm-editor')
  //     console.log(container.length)
  //   if(container.length == 2 && hasError){
  //     container[1].style.color = 'red'
  //     console.log(container)
  //   }
  //   // container.style.color = 'red'
  // }, [output])
  return (
    <>
      {/* {outputText} */}
      {/* {hasError? 'yess error':'no error'} */}
      <Box h={"100%"} maxH={"100%"} mb={40} w={"100%"} maxW={"500px"}>
        <WindowHeader
          status={hasError ? "error" : "none"}
          title={"console.exe"}
        />
        <Box bg={"gray.900"} h={"100%"}>
          {hasError && (
            <CodeMirror
              basicSetup={{
                lineNumbers: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
                highlightSelectionMatches: false,
                highlightSpecialChars: false,
              }}
              style={{ fontSize: "1.2rem", height: "90%", overflow: "hidden" }}
              height="100%"
              readOnly={true}
              editable={false}
              value={outputText}
              theme={supportedThemes[theme]}
            />
          )}
        </Box>
      </Box>
    </>
  );
}

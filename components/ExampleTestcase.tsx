import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { Testcase } from "../types";

const styles = {
  minHeight: "100px",
  width: "fit-content",
  maxWidth: "100%",
  color: "white",
  fontSize: "16px",
  padding: "20px",
  fontFamily: "Consolas,Courier New,monospace",
  backdropFilter: "blur(4px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  backgroundColor: "#111928bf",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,.125)",
};
interface ExampleTestcaseProps {
  testCase: Testcase;
}
function ExampleTestcase({ testCase }: ExampleTestcaseProps) {
  return (
    <Box style={styles}>
      {testCase.input && (
        <Box>
          <svg height="20">
            <circle
              cx="6"
              cy="6"
              r="6"
              fill="#FF5F56"
              stroke="#E0443E"
            ></circle>
            <circle
              cx="26"
              cy="6"
              r="6"
              fill="#FFBD2E"
              stroke="#DEA123"
            ></circle>
            <circle
              cx="46"
              cy="6"
              r="6"
              fill="#27C93F"
              stroke="#1AAB29"
            ></circle>
          </svg>
          <Text mr={4} display="inline" fontWeight={"extrabold"}>
            Input:
          </Text>
          {testCase?.frontendInput?.includes("\n") && <br />}
          <Text
            as="span"
            style={
              !testCase.frontendInput && testCase.input.includes("\n")
                ? { display: "block" }
                : {}
            }
            dangerouslySetInnerHTML={{
              __html: testCase.frontendInput
                ? testCase.frontendInput.replaceAll("\n", "<br>")
                : testCase.input.replaceAll("\n", "<br>"),
            }}
          ></Text>
        </Box>
      )}
      <Box>
        <Text mr={4} display="inline  " fontWeight={"extrabold"}>
          Output:
        </Text>
        {testCase.frontendInput?.includes("\n") && <br />}
        <Text
          display="inline"
          dangerouslySetInnerHTML={{
            __html: testCase.output?.replaceAll("\n", "<br>") || "",
          }}
        ></Text>
      </Box>
      {testCase.explaination && (
        <Box>
          <Text mr={4} display="inline" fontWeight={"extrabold"}>
            Explaination:
          </Text>
          <Text>{testCase.explaination}</Text>
        </Box>
      )}
    </Box>
  );
}

export default ExampleTestcase;

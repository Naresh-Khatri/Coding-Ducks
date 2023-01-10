import { Box, Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import Split from "react-split";
import EditableCode from "../components/EditableCode";
import CodeMirror from "@uiw/react-codemirror";

function Test() {
  const [inputs, setInputs] = useState({});

  return (
    <>
      <Box h={100} overflow="scroll">
        <CodeMirror autoFocus height="600px" style={{ fontSize: "1.2rem" }} />
      </Box>
      {/* <Flex align={"center"} justify="center" w={"100vw"} h={"100vh"}>
        
        <EditableCode
          text={`var %%carName%% = "%%Volvo%%";\n%%carName%%.toLowercase();`}
          setInputs={setInputs}
        />
        <Button
          w={100}
          onClick={() => {
            console.log(inputs);
          }}
        >
          show vals
        </Button>
      </Flex> */}
      {/* <Split
        className="split"
        minSize={150}
        maxSize={1000}
        style={{ height: "500px", width: "100%" }}
      >
        <Box>1</Box>
        <Box>2</Box>
      </Split> */}
    </>
  );
}

export default Test;

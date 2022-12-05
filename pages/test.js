import { Box, Flex } from "@chakra-ui/react";
import React from "react";
import Split from "react-split";
import EditableCode from "../components/EditableCode";

function Test() {
  return (
    <>
      <Flex align={"center"} justify="center" w={'100vw'} h={'100vh'}>
        <EditableCode text={`var %%carName%% = "%%Volvo%%";`} />
      </Flex>
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

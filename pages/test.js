import { Box } from "@chakra-ui/react";
import React from "react";
import Split from "react-split";

function Test() {
  return (
    <>
      <Split
        className="split"
        direction="vertical"
        minSize={150}
        maxSize={1000}
        style={{ height: "500px", width: "100%" }}
      >
        <Box>1</Box>
        <Box>2</Box>
      </Split>
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

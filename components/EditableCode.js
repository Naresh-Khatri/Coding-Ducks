import { Box, Text } from "@chakra-ui/react";
import React from "react";

function EditableCode({ text }) {
  const styles = {
    minHeight: "100px",
    minWidth: "400px",
    width: "-moz-fit-content",
    width: "fit-content",
    maxWidth: "800px",
    color: "white",
    fontSize: "18px",
    padding: "20px",
    fontFamily: "Consolas,Courier New,monospace",
    backdropFilter: "blur(4px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    backgroundColor: "#111928bf",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,.125)",
  };
  let textArray = text.split("%%");
  console.log(textArray)
  let parsed = textArray.map((text, index) => {
    if (index % 2 == 0) return text;
    else return `<input style=width:${text.length}rem value='ff' />`;
  });

  return (
    <Box style={styles}>
      <Box>
        <svg height="20">
          <circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E"></circle>
          <circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123"></circle>
          <circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29"></circle>
        </svg>
        <Text
          as="span"
          pl={5}
          // style={testCase.input.includes("<br>") ? { display: "block" } : {}}
          dangerouslySetInnerHTML={{ __html: parsed }}
        ></Text>
      </Box>
    </Box>
  );
}

export default EditableCode;

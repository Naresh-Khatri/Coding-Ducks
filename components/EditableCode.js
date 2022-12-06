import { Box, Input, Text } from "@chakra-ui/react";
import { useContext } from "react";
import { exerciseContext } from "../contexts/exerciseContext";

const CustomInput = ({ text, idx, setInputs }) => {
  return (
    <Input
      style={{ padding: "0 4px", width: `${text.length * 13 + 10}px` }}
      onChange={(e) => {
        setInputs((p) => {
          return { ...p, [Math.floor(+(idx / 2))]: e.target.value };
        });
      }}
    />
  );
};
function EditableCode() {
  const { sections, currProblem, currSection, userInputs, setUserInputs } =
    useContext(exerciseContext);
  const styles = {
    minHeight: "300px",
    minWidth: "500px",
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

  // let textArray = code.split("%%");
  let textArray = sections[currSection].problems[currProblem].code.split("%%");

  return (
    <Box style={styles}>
      <Box>
        <svg height="20">
          <circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E"></circle>
          <circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123"></circle>
          <circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29"></circle>
        </svg>
        {textArray.map((text, index) => {
          if (index % 2 == 0)
            return (
              <Text
                key={index}
                dangerouslySetInnerHTML={{
                  __html: text.replaceAll("\n", "<br>"),
                }}
                display="inline"
              ></Text>
            );
          else
            return (
              <CustomInput
                key={index}
                idx={index}
                text={text}
                setInputs={setUserInputs}
              />
            );
        })}
      </Box>
    </Box>
  );
}

export default EditableCode;

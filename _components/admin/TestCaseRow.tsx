import {
  Box,
  Flex,
  IconButton,
  Input,
  Switch,
  Td,
  Textarea,
  Tr,
} from "@chakra-ui/react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Testcase } from "../../types";
import FAIcon from "../FAIcon";

interface TestCaseRowProps {
  testCases: Testcase[];
  index: number;
  setTestCases: React.Dispatch<React.SetStateAction<Testcase[]>>;
}
function TestCaseRow({ testCases, index, setTestCases }: TestCaseRowProps) {
  return (
    <Tr key={index}>
      <Td>{index + 1}</Td>
      <Td m={0} py={4} px={2}>
        <Textarea
          isDisabled={!testCases[index].isPublic}
          placeholder="Frontend Input"
          value={testCases[index].frontendInput}
          onChange={(e) => {
            const newTestCases = [...testCases];
            newTestCases[index].frontendInput = e.target.value;
            setTestCases(newTestCases);
          }}
        />
      </Td>
      <Td m={0} py={4} px={2}>
        <Textarea
          placeholder="Input"
          value={testCases[index].input}
          onChange={(e) => {
            const newTestCases = [...testCases];
            newTestCases[index].input = e.target.value;
            setTestCases(newTestCases);
          }}
        />
      </Td>
      <Td m={0} py={4} px={2}>
        <Textarea
          placeholder="Output"
          value={testCases[index].output}
          onChange={(e) => {
            const newTestCases = [...testCases];
            newTestCases[index].output = e.target.value;
            setTestCases(newTestCases);
          }}
        />
      </Td>
      <Td m={0} py={4} px={2}>
        <Textarea
          isDisabled={!testCases[index].isPublic}
          placeholder="Exlaination"
          value={testCases[index].explaination}
          onChange={(e) => {
            const newTestCases = [...testCases];
            newTestCases[index].explaination = e.target.value;
            setTestCases(newTestCases);
          }}
        />
      </Td>
      <Td m={0} py={4} px={2}>
        <Flex justifyContent="center">
          {/* {testCases[index].isPublic ? "Public" : "Private"} */}
          <Switch
            id="private"
            size={"lg"}
            colorScheme="green"
            isChecked={testCases[index].isPublic}
            onChange={(e) => {
              const newTestCases = [...testCases];
              console.log("new state", e.target.checked);
              newTestCases[index].isPublic = e.target.checked;
              setTestCases(newTestCases);
              console.log(testCases);
            }}
          />
        </Flex>
      </Td>
      <Td m={0} py={4} px={2}>
        <Flex justifyContent="center">
          <IconButton
            aria-label="Delete test case"
            bg={"red.500"}
            icon={<FAIcon icon={faTrash} />}
            onClick={() => {
              const newTestCases = [...testCases];
              newTestCases.splice(index, 1);
              setTestCases(newTestCases);
            }}
          />
        </Flex>
      </Td>
    </Tr>
  );
}

export default TestCaseRow;

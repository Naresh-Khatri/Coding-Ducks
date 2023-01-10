import {
  Box,
  HStack,
  IconButton,
  Input,
  Td,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useState } from "react";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});
function ExerciseRow({ probIdx, secIdx, setSections }) {
  const {
    onOpen: onEditOpen,
    onClose: onEditClose,
    isOpen: isEditOpen,
  } = useDisclosure();

  const {
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
    isOpen: isDeleteOpen,
  } = useDisclosure();

  const handleOnProblemChange = (e, type) => {
    if (!e.target) return;
    setSections((p) =>
      p.map((sec, _secIdx) => {
        if (secIdx != _secIdx) return sec;
        else {
          const updatedProblems = sec.problems.map((problem, _probIdx) => {
            if (_probIdx != probIdx) return problem;
            else return { ...problem, [type]: e.target.value };
          });
          return { ...sec, problems: updatedProblems };
        }
      })
    );
  };

  const handleOnProblemRemoved = () => {
    setSections((p) =>
      p.map((sec, _secIdx) => {
        return sec;
        // if(_secIdx != secIdx) return sec
        // else{

        // }
      })
    );
  };

  // return null
  return (
    <Tr>
      <Td>{probIdx}</Td>
      <Td w={300}>
        <Input
          placeholder="Enter problem Title"
          onChange={(e) => {
            handleOnProblemChange(e, "title");
          }}
        />
      </Td>
      <Td>
        <Box bg="white" color={"black"} minH={150}>
          <QuillNoSSRWrapper
            theme="snow"
            value={"Enter Problem description"}
            modules={{
              toolbar: [
                ["bold", "italic", "underline", "strike", "blockquote"],
                ["code"],
              ],
            }}
            onChange={(e) => {
              handleOnProblemChange(e, "description");
            }}
          />
        </Box>
      </Td>
      <Td w={400}>
        <Box bg="white" color={"black"} minH={150}>
          <QuillNoSSRWrapper
            theme="snow"
            value={"Enter problem code"}
            modules={{
              toolbar: [],
            }}
            onChange={(e) => {
              handleOnProblemChange(e, "code");
            }}
          />
        </Box>
      </Td>
      <Td>
        <IconButton
          onClick={handleOnProblemRemoved}
          colorScheme={"red"}
          icon={<FontAwesomeIcon icon={faTrash} />}
        />
      </Td>
    </Tr>
  );
}

export default ExerciseRow;

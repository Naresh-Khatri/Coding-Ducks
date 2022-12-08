import {
  Box,
  HStack,
  IconButton,
  Input,
  Td,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useState } from "react";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});
function ExerciseRow({ problem, fetchProblems }) {
  const { id, title, description, code } = problem;
  const [problemDescription, setProblemDescription] = useState(description);
  const [problemTitle, setProblemTitle] = useState(title);
  const [problemCode, setProblemCode] = useState(code);

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

  return (
    <Tr>
      <Td>{id}</Td>
      <Td w={300}>
        <Input
          value={problemTitle}
          onChange={(e) => setProblemTitle(e.target.value)}
        />
      </Td>
      <Td>
        <Box bg="white" color={"black"} minH={150}>
          <QuillNoSSRWrapper
            theme="snow"
            value={problemDescription}
            modules={{
              toolbar: [
                ["bold", "italic", "underline", "strike", "blockquote"],
                ["code"],
              ],
            }}
            onChange={(e) => setProblemDescription(e.target.value)}
          />
        </Box>
      </Td>
      <Td w={400}>
        <Box bg="white" color={"black"} minH={150}>
          <QuillNoSSRWrapper
            theme="snow"
            value={problemCode}
            modules={{
              toolbar: [],
            }}
            onChange={(e) => setProblemCode(e.target.value)}
          />
        </Box>
      </Td>
    </Tr>
  );
}

export default ExerciseRow;

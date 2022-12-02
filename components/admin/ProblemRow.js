import { HStack, IconButton, Td, Tr, useDisclosure } from "@chakra-ui/react";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import React from "react";
import ExamDeleteModal from "./ExamDeleteModal";
import ExamEditor from "./ExamEditor";

function ProblemRow({ problem, fetchProblems }) {
  const { id, difficulty, title, description, tags } = problem;
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
      <Td>{difficulty}</Td>
      <Td>{title}</Td>
      <Td>
        <HStack>
          <IconButton
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={onEditOpen}
          />
          {/* <ExamDeleteModal
            examData={problem}
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            onOpen={onDeleteOpen}
            onDeleteSuccess={() => {
              fetchProblems();
              onDeleteClose();
            }}
          /> */}
          <IconButton
            bg="red.300"
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={onDeleteOpen}
          />
          {/* <ExamEditor
            examData={problem}
            isOpen={isEditOpen}
            onClose={onEditClose}
            onOpen={onEditOpen}
            onEditSuccess={() => {
              fetchProblems();
              onEditClose();
            }}
          /> */}
        </HStack>
      </Td>
    </Tr>
  );
}

export default ProblemRow;

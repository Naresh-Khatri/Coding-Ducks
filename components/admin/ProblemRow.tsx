import { HStack, IconButton, Td, Tr, useDisclosure } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import ProblemDeleteModal from "./ProblemDeleteModal";
import ProblemEditor from "./ProblemEditor";
import { Exam, Problem } from "../../hooks/useProblemsData";

function ProblemRow({
  problem,
  fetchProblems,
  examsList,
}: {
  problem: Problem;
  fetchProblems: () => void;
  examsList: Exam[];
}) {
  const { id, exam, examId, order, difficulty, title, description, tags } =
    problem;
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
    <>
      <Td>{id}</Td>
      <Td>
        {examId}. {exam.title}
      </Td>
      <Td>{order}</Td>
      <Td>{difficulty}</Td>
      <Td>{title}</Td>
      <Td>
        <HStack>
          <IconButton
            aria-label="Edit Problem"
            icon={<FontAwesomeIcon icon={faEdit as IconProp} />}
            onClick={onEditOpen}
          />
          <ProblemEditor
            problemData={problem}
            examsList={examsList}
            isOpen={isEditOpen}
            onClose={onEditClose}
            onEditSuccess={() => {
              fetchProblems();
              onEditClose();
            }}
          />
          <IconButton
            aria-label="Delete Problem"
            bg="red.500"
            icon={<FontAwesomeIcon icon={faTrash as IconProp} />}
            onClick={onDeleteOpen}
          />
          <ProblemDeleteModal
            problemData={problem}
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            onDeleteSuccess={() => {
              fetchProblems();
              onDeleteClose();
            }}
          />
        </HStack>
      </Td>
    </>
  );
}

export default ProblemRow;

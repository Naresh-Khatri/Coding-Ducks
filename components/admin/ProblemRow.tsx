import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Td,
  Text,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import ProblemDeleteModal from "./ProblemDeleteModal";
import ProblemEditor from "./ProblemEditor";
import { IExam, IProblem } from "../../types";
import FAIcon from "../FAIcon";
import { CheckCircleIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";

function ProblemRow({
  problem,
  fetchProblems,
  examsList,
}: {
  problem: IProblem;
  fetchProblems: () => void;
  examsList: IExam[];
}) {
  const {
    id,
    exam,
    examId,
    isActive,
    order,
    frontendProblemId,
    difficulty,
    title,
    description,
    tags,
  } = problem;
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
      <Td w={"30px"}>{frontendProblemId}</Td>
      <Td>
        <Text>{title}</Text>
      </Td>
      <Td>{difficulty}</Td>
      <Td>{examId ? `${examId}. ${exam?.title}` : <Badge>Na</Badge>}</Td>
      <Td>{examId ? `${order}` : <Badge>Na</Badge>}</Td>
      <Td>
        {isActive ? (
          <CheckIcon color={"green.400"} />
        ) : (
          <CloseIcon color={"red.400"} />
        )}
      </Td>
      <Td>
        <HStack>
          <IconButton
            aria-label="Edit Problem"
            icon={<FAIcon icon={faEdit} />}
            onClick={onEditOpen}
          />
          {isEditOpen && (
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
          )}
          <IconButton
            aria-label="Delete Problem"
            bg="red.500"
            icon={<FAIcon icon={faTrash} />}
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

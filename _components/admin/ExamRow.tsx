import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { HStack, IconButton, Td, useDisclosure } from "@chakra-ui/react";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import React from "react";
import ExamDeleteModal from "./ExamDeleteModal";
import ExamEditor from "./ExamEditor";
import FAIcon from "../FAIcon";

function ExamRow({ exam, fetchExams }) {
  const { id, coverImg, title, description, endTime, startTime, active } = exam;
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
        <Image
          src={coverImg}
          width={100}
          height={100}
          alt={title + " cover image"}
          style={{ borderRadius: "10%", width: "auto" }}
        />
      </Td>
      <Td>{title}</Td>
      <Td>{startTime}</Td>
      <Td>
        {active ? (
          <CheckIcon color={"green.400"} />
        ) : (
          <CloseIcon color={"red.600"} />
        )}
      </Td>
      <Td>
        <HStack>
          <IconButton
            aria-label="Edit Exam"
            icon={<FAIcon icon={faEdit} />}
            onClick={onEditOpen}
          />
          <ExamEditor
            examData={exam}
            isOpen={isEditOpen}
            onClose={onEditClose}
            onEditSuccess={() => {
              fetchExams();
              onEditClose();
            }}
          />
          <IconButton
            aria-label="Delete Exam"
            bg="red.300"
            icon={<FAIcon icon={faTrash} />}
            onClick={onDeleteOpen}
          />
          <ExamDeleteModal
            examData={exam}
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            onDeleteSuccess={() => {
              fetchExams();
              onDeleteClose();
            }}
          />
        </HStack>
      </Td>
    </>
  );
}

export default ExamRow;

import { HStack, IconButton, Td, Tr, useDisclosure } from "@chakra-ui/react";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import React from "react";
import ExamDeleteModal from "./ExamDeleteModal";
import ExamEditor from "./ExamEditor";

function ExamRow({ exam, fetchExams }) {
  const { id, coverImg, title, description, endTime, startTime } = exam;
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
      <Td>
        <img
          src={coverImg}
          width={100}
          height={100}
          alt={title + " cover image"}
          style={{ borderRadius: "10%" }}
        />
      </Td>
      <Td>{title}</Td>
      <Td>{startTime}</Td>
      <Td>
        <HStack>
          <IconButton
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={onEditOpen}
          />
          <ExamDeleteModal
            examData={exam}
            isOpen={isDeleteOpen}
            onClose={onDeleteClose}
            onOpen={onDeleteOpen}
            onDeleteSuccess={() => {
              fetchExams();
              onDeleteClose();
            }}
          />
          <IconButton
            bg="red.300"
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={onDeleteOpen}
          />
          <ExamEditor
            examData={exam}
            isOpen={isEditOpen}
            onClose={onEditClose}
            onOpen={onEditOpen}
            onEditSuccess={() => {
              fetchExams();
              onEditClose();
            }}
          />
        </HStack>
      </Td>
    </Tr>
  );
}

export default ExamRow;

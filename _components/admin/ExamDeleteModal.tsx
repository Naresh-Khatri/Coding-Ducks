import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import axios from "../../lib/axios";
import React from "react";
import ExamCard from "../ExamCard";

function ExamDeleteModal({ examData, isOpen, onClose, onDeleteSuccess }) {
  const toast = useToast();
  const deleteExam = async () => {
    try {
      const res = await axios.delete(`/exams/${examData.id}`);
      console.log(res.data);
      toast({
        title: "Exam deleted!",
        status: "success",
        description: "Exam has been deleted.",
        duration: 9000,
        isClosable: true,
      });
      onDeleteSuccess();
    } catch (err) {
      console.log(err);
      toast({
        title: "Error",
        description: "Something went wrong while Deteting!",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{examData.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Are you sure you wanna delete this exam?</Text>
          <Flex justify={"center"} p={5} pointerEvents={"none"}>
            <ExamCard examData={examData} />
          </Flex>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button bg="red.500" onClick={deleteExam}>
              Delete
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ExamDeleteModal;

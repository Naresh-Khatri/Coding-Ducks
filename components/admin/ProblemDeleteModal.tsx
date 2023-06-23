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

function ProblemDeleteModle({ problemData, isOpen, onClose, onDeleteSuccess }) {
  const toast = useToast();
  const deleteProblem = async () => {
    try {
      const res = await axios.delete(`/problems/${problemData.id}`);
      console.log(res.data);
      toast({
        title: "Problem deleted!",
        status: "success",
        description: "Problem has been deleted.",
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
        <ModalHeader>Are you sure?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>{problemData.title}</Text>
          <Flex justify={"center"} p={5} pointerEvents={"none"}>
            <Text
              dangerouslySetInnerHTML={{ __html: problemData.description }}
            ></Text>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button bg="red.500" onClick={deleteProblem}>
              Delete
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ProblemDeleteModle;

import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function ExamDetailsModel({ examData, isOpen, onClose, onOpen }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Exam Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* <Text fontSize={"7xl"}> WIP</Text> */}
          <Flex alignItems={"center"}>
            <Image
              src={examData.coverImg}
              width={200}
              height={200}
              alt={"exam name " + examData.title}
            />
            <Flex
              justifyContent={"center"}
              alignItems="center"
              flexDir="column"
              w={"100%"}
            >
              <Text fontSize={"xl"} fontWeight={"extrabold"} mr={4}>
                Title:
              </Text>
              {examData.title}
            </Flex>
          </Flex>
          <Text
            color={"gray.500"}
            noOfLines={4}
            pt={4}
            dangerouslySetInnerHTML={{ __html: examData.description }}
          ></Text>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Link href={"/take-test/" + examData.slug}>
            <Button colorScheme="purple">Take test</Button>
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ExamDetailsModel;

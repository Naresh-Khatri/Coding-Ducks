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
import { useState } from "react";

function ExamDetailsModel({ examData, isOpen, onClose, canStartExam, timerText, onOpen }) {
  const [readMore, setReadMore] = useState(false);

  // this func closes modal and sets readMore to false
  const handleClose = () => {
    onClose();
    setReadMore(false);
  };
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
              style={{ objectFit: "cover", borderRadius: "20px" }}
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
            noOfLines={readMore ? 100 : 4}
            pt={4}
            dangerouslySetInnerHTML={{ __html: examData.description }}
          ></Text>
          {!readMore && (
            <Button
              variant={"ghost"}
              onClick={() => setReadMore(true)}
              size="sm"
              p={0}
            >
              Read more...
            </Button>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Close
          </Button>
          <Link href={"/contests/" + examData.slug}>
            <Button colorScheme="purple" disabled={canStartExam}>
              {canStartExam ? timerText : "Start Exam"}
              </Button>
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ExamDetailsModel;

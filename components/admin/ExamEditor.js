import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
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
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

import { useState } from "react";
import { async } from "@firebase/util";
import axios from "axios";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  const second = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};
function ExamEditor({ isOpen, onClose, examData, onEditSuccess }) {
  const { title, description, startTime, coverImg } = examData;

  const [newTitle, setNewTitle] = useState(title);
  const [newDescription, setNewDescription] = useState(
    description.replace(/\\n/g, " ")
  );
  const [newStartTime, setNewStartTime] = useState(formatDate(startTime));
  const [newCoverImg, setNewCoverImg] = useState(coverImg);

  const toast = useToast();
  const updateExam = async () => {
    const payload = {
      title: newTitle,
      description: newDescription,
      startTime: new Date(newStartTime).toISOString(),
      coverImg: newCoverImg,
    };
    try {
      const res = await axios.patch(
        `http://localhost:3333/exams/${examData.id}`,
        payload
      );
      toast({
        title: "Exam updated!",
        status: "success",
        description: "Exam has been updated.",
        duration: 9000,
        isClosable: true,
      });
      onEditSuccess();
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        status: "error",
        description: "Something went wrong",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal onClose={onClose} size={"4xl"} isOpen={isOpen}>
      <ModalOverlay backdropFilter="auto" backdropBlur="2px" />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* {JSON.stringify(examData, null, 2)} */}
          <HStack my={3}>
            <FormControl>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                placeholder="Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontWeight={"normal"}>Start time</FormLabel>
              <InputGroup size="md">
                <Input
                  type={"datetime-local"}
                  value={newStartTime}
                  onChange={(e) => {
                    console.log(e.target.value);
                    setNewStartTime(e.target.value);
                  }}
                />
              </InputGroup>
            </FormControl>
          </HStack>

          <FormControl my={3}>
            <FormLabel htmlFor="desc">Description</FormLabel>

            <Box bg="white" color={"black"} borderRadius={10}>
              <QuillNoSSRWrapper
                style={{ borderRadius: 10 }}
                theme="snow"
                value={newDescription}
                onChange={setNewDescription}
              />
            </Box>
          </FormControl>

          <Flex mt={10}>
            <FormControl mr="5%">
              <FormLabel htmlFor="cover-img" fontWeight={"normal"}>
                Cover photo (URL)
              </FormLabel>
              <Input
                id="cover-img"
                placeholder="Image URL"
                value={newCoverImg}
                onChange={(e) => setNewCoverImg(e.target.value)}
              />
            </FormControl>
            {newCoverImg && (
              <img
                src={newCoverImg}
                alt="cover image"
                width="300px"
                style={{ borderRadius: 20 }}
              />
            )}
          </Flex>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant={"outline"} onClick={onClose}>
              Close
            </Button>
            <Button bg="purple.500" onClick={updateExam}>
              Update
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ExamEditor;

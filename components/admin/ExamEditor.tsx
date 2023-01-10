import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  useToast,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

import { useRef, useState } from "react";
import { async } from "@firebase/util";
import axios from "../../utils/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
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
  const { title, description, startTime, coverImg, slug, active, marks } =
    examData;

  const [newTitle, setNewTitle] = useState(title);
  const [newSlug, setNewSlug] = useState(slug);
  const [newActive, setNewActive] = useState(active);
  const [newDescription, setNewDescription] = useState(
    description.replace(/\\n/g, " ")
  );
  const [newStartTime, setNewStartTime] = useState(formatDate(startTime));
  const [newMarks, setNewMarks] = useState(marks);

  const [oldCoverImg, setOldCoverImg] = useState(coverImg);
  const [newCoverImg, setNewCoverImg] = useState();

  const cropperRef = useRef(null);

  const toast = useToast();

  const convertCanvasToBlob = (canvas) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  };
  const onFileChange = (e) => {
    if (!e.target) return;
    console.log(e);
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    console.log(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      setNewCoverImg(e.target.result);
    };
  };
  const updateExam = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", newDescription);
    formData.append("slug", newSlug);
    formData.append("active", newActive);
    formData.append("marks", newMarks);

    formData.append("startTime", new Date(startTime).toISOString());
    if (newCoverImg) {
      const data = await convertCanvasToBlob(cropperRef.current.getCanvas());
      formData.append("coverImg", data);
    }
    try {
      const res = await axios.patch(`/exams/${examData.id}`, formData);
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
            <FormControl>
              <FormLabel fontWeight={"normal"}>Marks</FormLabel>
              <InputGroup size="md">
                <Input
                  type={"number"}
                  value={newMarks}
                  onChange={(e) => setNewMarks(e.target.value)}
                />
              </InputGroup>
            </FormControl>
          </HStack>
          <HStack my={3}>
            <FormControl>
              <FormLabel htmlFor="slug">Slug</FormLabel>
              <Input
                id="slug"
                placeholder="Slug"
                value={newSlug}
                onChange={(e) => setNewSlug(encodeURI(e.target.value))}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="active" mb="0">
                Set Active?
              </FormLabel>
              <Switch
                id="active"
                isChecked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
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
            {oldCoverImg ? (
              <Box position={"relative"}>
                <Image
                  width={"300"}
                  height={"170"}
                  src={oldCoverImg}
                  alt="cover image"
                  style={{ borderRadius: "10%" }}
                />
                <IconButton
                  position={"absolute"}
                  zIndex={1}
                  top={-5}
                  right={-5}
                  icon={<FontAwesomeIcon icon={faTrash} />}
                  bg="red.300"
                  color="white"
                  onClick={() => setOldCoverImg("")}
                />
              </Box>
            ) : newCoverImg ? (
              <Box position={"relative"}>
                <Cropper
                  ref={cropperRef}
                  src={newCoverImg}
                  className={"cropper"}
                  aspectRatio={16 / 10}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "300px",
                  }}
                />
                <IconButton
                  position={"absolute"}
                  zIndex={1}
                  top={-5}
                  right={-5}
                  icon={<FontAwesomeIcon icon={faTrash} />}
                  bg="red.300"
                  color="white"
                  onClick={() => setNewCoverImg("")}
                />
              </Box>
            ) : (
              <Input type="file" onChange={onFileChange} accept="image/*" />
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

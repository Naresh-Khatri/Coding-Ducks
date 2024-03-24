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
  useToast,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { createAspectRatio, Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

import { useEffect, useRef, useState } from "react";
import axios from "../../lib/axios";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { IExam } from "../../types";
import FAIcon from "../FAIcon";
const QuillNoSSRWrapper = dynamic(() => import("react-quill"), {
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
interface ExamEditorProps {
  isOpen: boolean;
  onClose: () => void;
  examData: IExam;
  onEditSuccess: () => void;
}

function ExamEditor({
  isOpen,
  onClose,
  examData,
  onEditSuccess,
}: ExamEditorProps) {
  const {
    title,
    description,
    startTime,
    endTime,
    isBounded,
    warnOnBlur,
    coverImg,
    slug,
    active,
    marks,
  }: IExam = examData;

  const [newTitle, setNewTitle] = useState(title);
  const [newSlug, setNewSlug] = useState(slug);
  const [newActive, setNewActive] = useState(active);
  const [newDescription, setNewDescription] = useState(
    description.replace(/\\n/g, " ")
  );
  const [newStartTime, setNewStartTime] = useState(formatDate(startTime));
  const [newEndTime, setNewEndTime] = useState(formatDate(endTime));
  const [newMarks, setNewMarks] = useState(marks || 0);
  const [newIsBounded, setNewIsBounded] = useState(isBounded);
  const [newWarnOnBlur, setNewWarnOnBlur] = useState(warnOnBlur);

  const [oldCoverImg, setOldCoverImg] = useState(coverImg);
  const [newCoverImg, setNewCoverImg] = useState<any>();

  const cropperRef = useRef<CropperRef>(null);

  const toast = useToast();

  useEffect(() => {
    setNewTitle(title);
    setNewSlug(slug);
    setNewActive(active);
    setNewWarnOnBlur(warnOnBlur);
    setNewDescription(description.replace(/\\n/g, " "));
    setNewStartTime(formatDate(startTime));
    setNewEndTime(formatDate(endTime));
    setNewMarks(marks || 0);
    setOldCoverImg(coverImg);
    setNewCoverImg(null);
  }, [examData]);

  const convertCanvasToBlob = (canvas: any): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob: Blob) => {
        resolve(blob);
      });
    });
  };
  const onFileChange = (e) => {
    if (!e.target) return;
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      if (e.target) setNewCoverImg(e.target.result);
    };
  };
  const updateExam = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", newDescription);
    formData.append("slug", newSlug);
    formData.append("active", String(newActive));
    formData.append("isBounded", String(newIsBounded));
    formData.append("warnOnBlur", String(newWarnOnBlur));
    formData.append("marks", String(newMarks));
    formData.append("startTime", new Date(newStartTime).toISOString());
    formData.append("endTime", new Date(newEndTime).toISOString());

    if (newCoverImg && cropperRef.current) {
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
                    setNewStartTime(e.target.value);
                  }}
                />
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel fontWeight={"normal"}>end time</FormLabel>
              <InputGroup size="md">
                <Input
                  type={"datetime-local"}
                  value={newEndTime}
                  onChange={(e) => {
                    setNewEndTime(e.target.value);
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
                  onChange={(e) => setNewMarks(+e.target.value)}
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
              <FormLabel htmlFor="isBounded" mb="0">
                Is Bounded?
              </FormLabel>
              <Switch
                id="isBounded"
                isChecked={newIsBounded}
                onChange={(e) => setNewIsBounded(e.target.checked)}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="blur-warning" mb="0">
                Warn on blur?
              </FormLabel>
              <Switch
                id="blur-warning"
                isChecked={newWarnOnBlur}
                onChange={(e) => setNewWarnOnBlur(e.target.checked)}
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
                  width={300}
                  height={300}
                  src={oldCoverImg}
                  alt="cover image"
                  style={{ borderRadius: "10%", width: "auto" }}
                />
                <IconButton
                  aria-label="Delete"
                  position={"absolute"}
                  zIndex={1}
                  top={-5}
                  right={-5}
                  icon={<FAIcon icon={faTrash} />}
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
                  aspectRatio={createAspectRatio(16 / 9)}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "300px",
                  }}
                />
                <IconButton
                  aria-label="Delete"
                  position={"absolute"}
                  zIndex={1}
                  top={-5}
                  right={-5}
                  icon={<FAIcon icon={faTrash} />}
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

import React, { useRef, useState } from "react";
import {
  Progress,
  Box,
  ButtonGroup,
  Button,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  FormHelperText,
  Text,
  HStack,
  IconButton,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import axios from "../../utils/axios";
import { useRouter } from "next/router";
import { Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddExam = () => {
  const [desc, setDesc] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState('')
  const [startTime, setStartTime] = useState("");
  const [coverImg, setCoverImg] = useState("");

  const cropperRef = useRef(null);
  const toast = useToast();
  const router = useRouter();

  const onFileChange = (e) => {
    if (!e.target) return;
    console.log(e);
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    console.log(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      setCoverImg(e.target.result);
    };
  };

  const convertCanvasToBlob = (canvas) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  };
  const submit = async () => {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("description", desc);
      formData.append("startTime", new Date(startTime).toISOString());
      formData.append(
        "coverImg",
        await convertCanvasToBlob(cropperRef.current.getCanvas())
      );

      // console.log(cropperRef.current.getCanvas());
      // console.log(await convertCanvasToBlob(cropperRef.current.getCanvas()));
      // return;
      const res = await axios.post("/exams", formData);
      toast({
        title: "Exam created!",
        status: "success",
        description: "New exam has been created.",
        duration: 9000,
        isClosable: true,
      });
      router.push("/dashboard/exams");
    } catch (error) {
      toast({
        title: "Please check the fields!",
        description: "An error has occured.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      console.log(error);
    }
  };

  return (
    <>
      <AdminLayout>
        <Flex
          direction={"column"}
          p={10}
          w={"100%"}
          alignItems="center"
          overflowY={"scroll"}
        >
          <Box w={"900px"}>
            <Heading
              w="100%"
              textAlign={"center"}
              fontWeight={"extrabold"}
              fontSize={"4xl"}
              mb={20}
            >
              Create an exam!
            </Heading>
            <HStack my={3}>
              <FormControl mr="5%">
                <FormLabel htmlFor="first-name" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input
                  id="first-name"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormControl>
              <FormControl mr="5%">
                <FormLabel htmlFor="first-name" fontWeight={"normal"}>
                  Slug
                </FormLabel>
                <Input
                  id="first-name"
                  placeholder="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight={"normal"} mt="2%">
                  Start time
                </FormLabel>
                <InputGroup size="md">
                  <Input
                    type={"datetime-local"}
                    placeholder="Enter password"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
            </HStack>

            <FormControl mt="2%">
              <FormLabel htmlFor="email" fontWeight={"normal"}>
                Description
              </FormLabel>
              <Box bg="white" color={"black"}>
                <QuillNoSSRWrapper
                  theme="snow"
                  value={desc}
                  onChange={setDesc}
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      ["code"],
                    ],
                  }}
                />
                
              </Box>
              <FormHelperText>Describe about your exam</FormHelperText>
            </FormControl>

            <Flex>
              <FormControl mr="5%">
                <FormLabel htmlFor="cover-img" fontWeight={"normal"}>
                  Cover photo (URL)
                </FormLabel>
                {coverImg ? (
                  <>
                    <Box position={"relative"}>
                      <Cropper
                        ref={cropperRef}
                        src={coverImg}
                        onChange={onFileChange}
                        className={"cropper"}
                        aspectRatio={16 / 10}
                        style={{
                          width: "100%",
                          height: "100%",
                          maxWidth: "300px",
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
                        onClick={() => setCoverImg("")}
                      />
                      {/* <img src={coverImg} alt="cover image" /> */}
                    </Box>
                  </>
                ) : (
                  <Input type="file" onChange={onFileChange} accept="image/*" />
                )}
              </FormControl>
            </Flex>
            <FormControl>
              <Button colorScheme={"green"} mt={3} onClick={submit}>
                Create
              </Button>
            </FormControl>
          </Box>
        </Flex>
      </AdminLayout>
    </>
  );
};

export default AddExam;

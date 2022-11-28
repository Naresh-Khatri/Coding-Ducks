import React, { useState } from "react";
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
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/router";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddExam = () => {
  const [show, setShow] = useState(false);
  const [desc, setDesc] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [coverImg, setCoverImg] = useState("");

  const toast = useToast();
  const router = useRouter();

  const submit = async () => {
    try {
      const payload = {
        title,
        description: desc,
        startTime: new Date(startTime).toISOString(),
        coverImg,
      };
      const res = await axios.post("http://localhost:3333/exams", payload);
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
        <Flex direction={"column"} p={10} w={"100%"} alignItems="center">
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
              </FormControl>{" "}
              <FormControl>
                <FormLabel fontWeight={"normal"} mt="2%">
                  Start time
                </FormLabel>
                <InputGroup size="md">
                  <Input
                    pr="4.5rem"
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
                />
              </Box>
              <FormHelperText>Describe about your exam</FormHelperText>
            </FormControl>

            <Flex>
              <FormControl mr="5%">
                <FormLabel htmlFor="cover-img" fontWeight={"normal"}>
                  Cover photo (URL)
                </FormLabel>
                <Input
                  id="cover-img"
                  placeholder="Image URL"
                  value={coverImg}
                  onChange={(e) => setCoverImg(e.target.value)}
                />
              </FormControl>
              {coverImg && (
                <img
                  src={coverImg}
                  alt="cover image"
                  height="200"
                  width="auto"
                />
              )}
            </Flex>
            <FormControl>
              <Button bg="green.500" mt={3} onClick={submit}>
                <Text fontWeight={"extrabold"} fontSize={"2xl"}>
                  Create
                </Text>
              </Button>
            </FormControl>
          </Box>
        </Flex>
      </AdminLayout>
    </>
  );
};

export default AddExam;

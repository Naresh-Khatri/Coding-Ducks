import React, { useState } from "react";
import {
  Box,
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
  RadioGroup,
  Radio,
  Stack,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import "react-quill/dist/quill.snow.css";

import dynamic from "next/dynamic";
import axios from "axios";
import { useRouter } from "next/router";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const AddExam = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diffLevel, setDiffLevel] = useState("easy");

  const router = useRouter();

  const toast = useToast();
  const submit = async () => {
    try {
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
              </FormControl>
              <RadioGroup onChange={setDiffLevel} value={diffLevel}>
                <Stack direction="row">
                  <Radio value="easy">Easy</Radio>
                  <Radio value="medium">Medium</Radio>
                  <Radio value="hard">hard</Radio>
                </Stack>
              </RadioGroup>
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

            <Flex mt={10}>
              <FormControl>
                <FormLabel htmlFor="cover-img" fontWeight={"normal"}>
                  TestCases
                </FormLabel>
                <Input
                  id="cover-img"
                  placeholder="Image URL"
                  // value={coverImg}
                  // onChange={(e) => setCoverImg(e.target.value)}
                />
              </FormControl>
            </Flex>
            <FormControl>
              <Button bg="green.500" mt={3} onClick={submit}>
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

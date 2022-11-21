import React, { useState } from "react";
import {
  Progress,
  Box,
  ButtonGroup,
  Button,
  Heading,
  Flex,
  FormControl,
  GridItem,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  InputLeftAddon,
  InputGroup,
  Textarea,
  FormHelperText,
  InputRightElement,
  Text,
} from "@chakra-ui/react";

import AdminLayout from "../../layout/AdminLayout";

import { useToast } from "@chakra-ui/react";

import dynamic from "next/dynamic";
const QuillNoSSRWrapper = dynamic(import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});
import "react-quill/dist/quill.snow.css";

const AddExam = () => {
  const [show, setShow] = useState(false);
  const [desc, setDesc] = useState("");
  const handleClick = () => setShow(!show);
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
            <Flex>
              <FormControl mr="5%">
                <FormLabel htmlFor="first-name" fontWeight={"normal"}>
                  Title
                </FormLabel>
                <Input id="first-name" placeholder="First name" />
              </FormControl>
            </Flex>
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
                ;
              </Box>
              <FormHelperText>Describe about your exam</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel fontWeight={"normal"} mt="2%">
                Start time
              </FormLabel>
              <InputGroup size="md">
                <Input
                  pr="4.5rem"
                  type={"datetime-local"}
                  placeholder="Enter password"
                />
              </InputGroup>
            </FormControl>
            <FormControl>
              <Button bg="green.500" mt={3}>
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

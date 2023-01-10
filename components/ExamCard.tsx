import {
  Box,
  Button,
  Flex,
  Heading,
  Spacer,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import React from "react";
import { useColorModeValue } from "@chakra-ui/react";
import ExamDetailsModel from "./ExamDetailsModel";

function ExamCard({ examData }) {
  const { title, description, coverImg } = examData;
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  return (
    <Flex
      direction={"column"}
      bg={useColorModeValue("white", "gray.700")}
      boxShadow={"2xl"}
      w={300}
      h={420}
      borderRadius={20}
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: "scale(1.05)",
      }}
      onClick={onToggle}
    >
      {/* <Button onClick={onToggle}>toggle</Button> */}
      <Box w={300} h={180} position={"relative"} overflow={"hidden"}>
        <Image
          src={coverImg}
          width={"300"}
          height={"300"}
          alt="cat exam"
          style={{
            borderRadius: "20px 20px 0 0",
            objectFit: "cover",
            width: "100%",
            height: "auto",
          }}
        />
      </Box>
      <Stack p={3}>
        <Text
          color={"green.500"}
          textTransform={"uppercase"}
          fontWeight={800}
          fontSize={"sm"}
          letterSpacing={1.1}
        >
          Exam
        </Text>
        <Heading
          color={useColorModeValue("gray.700", "white")}
          fontSize={"2xl"}
          fontFamily={"body"}
          noOfLines={1}
        >
          {title}
        </Heading>
        <Text
          color={"gray.500"}
          noOfLines={4}
          dangerouslySetInnerHTML={{ __html: description }}
        ></Text>
      </Stack>
      <Spacer />
      <Button
        bg={"purple.600"}
        color="white"
        mb={4}
        mx={2}
        shadow={"2xl"}
        // disabled
        _hover={{}}
      >
        {/* Opens on {start} */}
        Show details
      </Button>
      <ExamDetailsModel
        examData={examData}
        onClose={onClose}
        isOpen={isOpen}
        onOpen={onOpen}
      />
    </Flex>
  );
}

export default ExamCard;

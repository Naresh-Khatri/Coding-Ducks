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
import React, { useCallback, useEffect, useState } from "react";
import { useColorModeValue } from "@chakra-ui/react";
import ExamDetailsModel from "./ExamDetailsModel";
import { Exam } from "../hooks/useProblemsData";

function ExamCard({ examData }) {
  const { title, description, startTime, isBounded, coverImg }: Exam = examData;
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();

  const [timerText, setTimerText] = useState("");
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (isBounded) {
      setTimer(setInterval(updateTimerText, 1000));
    }
  }, []);

  const updateTimerText = useCallback(() => {
    const sTime = new Date(startTime);
    const currTime = new Date();
    if (sTime < currTime) {
      setTimerText("00:00:00");
      clearInterval(timer);
      return;
    }
    const diffInMs= sTime.getTime() - currTime.getTime();

    // Get hours and minutes from the difference in milliseconds
    const diffHours = Math.floor(diffInMs / 3600000);
    const diffMinutes = Math.floor((diffInMs % 3600000) / 60000);
    const diffSeconds = Math.floor(((diffInMs % 360000) % 60000) / 1000);

    // Format the difference as a string in the format "hh:mm"
    const formattedDiff = `${diffHours >= 10 ? diffHours : `0${diffHours}`}:${
      diffMinutes >= 10 ? diffMinutes : `0${diffMinutes}`
    }:${diffSeconds >= 10 ? diffSeconds : `0${diffSeconds}`}`;
    setTimerText(formattedDiff);
  }, [startTime, timer]);

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
          width={350}
          height={350}
          alt="cat exam"
          style={{
            borderRadius: "20px 20px 0 0",
            objectFit: "cover",
            width: "auto",
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
        disabled={isBounded && timerText !== "00:00:00"}
        _hover={{}}
      >
        {isBounded && timerText !== "00:00:00" ? timerText : "Start Exam"}
      </Button>
      <ExamDetailsModel
        examData={examData}
        canStartExam={isBounded && timerText !== "00:00:00"}
        timerText={timerText}
        onClose={onClose}
        isOpen={isOpen}
        onOpen={onOpen}
      />
    </Flex>
  );
}

export default ExamCard;

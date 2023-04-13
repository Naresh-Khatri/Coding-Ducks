import React, { useCallback, useEffect, useState } from "react";
import { useExamData } from "../hooks/useExamsData";
import { useRouter } from "next/router";
import {
  Button,
  Center,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Toast,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Exam } from "../hooks/useProblemsData";
import Image from "next/image";

function Timer() {
  const router = useRouter();
  const { slug } = router.query;
  const {
    data: examData,
    refetch: refetchExamData,
    isLoading: examDataLoading,
    isError: examDataError,
  } = useExamData(slug as string);

  const [timer, setTimer] = useState(null);
  const [timerText, setTimerText] = useState("Unbounded");
  const { isBounded, endTime } = examData?.data as Exam;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [warningShown, setWarningShown] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (!examData || !examData.data.endTime) return;

    const s = setInterval(startTimer, 1000);
    setTimer(s);

    return () => {
      clearInterval(s);
    };
  }, [examData]);

  const startTimer = () => {
    const eTime = new Date(endTime);
    const currTime = new Date();

    if (currTime > eTime) {
      setTimerText("ended");
      clearInterval(timer);
      toast({
        title: "Exam Ended",
        description: "You can now view your results",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      // router.push("/home");
      return;
    }
    const diffInMs = eTime.getTime() - currTime.getTime();

    // Get hours and minutes from the difference in milliseconds
    const diffHours = Math.floor(diffInMs / 3600000);
    const diffMinutes = Math.floor((diffInMs % 3600000) / 60000);
    const diffSeconds = Math.floor(((diffInMs % 360000) % 60000) / 1000);

    // Format the difference as a string in the format "hh:mm"
    const formattedDiff = `${diffHours >= 10 ? diffHours : `0${diffHours}`}:${
      diffMinutes >= 10 ? diffMinutes : `0${diffMinutes}`
    }:${diffSeconds >= 10 ? diffSeconds : `0${diffSeconds}`}`;

    setTimerText(formattedDiff);

    if (
      diffHours === 0 &&
      ((diffMinutes === 5 && diffSeconds === 0) ||
        (diffMinutes === 3 && diffSeconds === 0) ||
        (diffMinutes === 2 && diffSeconds === 0) ||
        (diffMinutes === 1 && diffSeconds === 0))
    )
      toast({
        title: "Exam Ending",
        description: `You have ${diffMinutes} minutes left`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });

    if (!warningShown && !isOpen && diffHours === 0 && diffMinutes < 10) {
      onOpen();
    }
  };

  const onWarningOkayHandler = () => {
    console.log("Warning okay");
    setWarningShown(true);
    onClose();
  };

  return (
    <>
      <HStack justifyContent={"center"} alignContent={"center"}>
        <FontAwesomeIcon height={"1.2rem"} icon={faClock as IconProp} />
        <Text fontWeight={"extrabold"}>
          {isBounded ? timerText : "Unbounded"}
        </Text>
      </HStack>
      {!warningShown && (
        <Modal onClose={onClose} size={"md"} isOpen={isOpen}>
          <ModalOverlay backdropFilter="blur(5px)" />
          <ModalContent>
            <ModalHeader>Speed it up!</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack justifyContent={"center"} alignContent={"center"}>
                <Image
                  src={
                    "https://ik.imagekit.io/couponluxury/coding_ducks/gifs/2d037c70936397.5bb439fbda19f_leAvQOZbz.gif"
                  }
                  alt="Coding Ducks"
                  style={{ borderRadius: "10px" }}
                  width={300}
                  height={300}
                />
                <Text fontSize={"3xl"} fontWeight={"extrabold"}>
                  You have {timerText} left!
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onWarningOkayHandler} colorScheme="purple">
                Okay
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default Timer;

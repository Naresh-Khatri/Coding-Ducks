import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Image from "next/image";
import { useEffect, useState } from "react";

const randIdx = Math.floor(Math.random() * 2);
const COOLDOWN_PERIOD = 300;

function WarnOnTabLeave() {
  const images = [
    "https://ik.imagekit.io/couponluxury/63d98670936397.5bb439fbdfabb_jxOOxoUWlm.gif",
    "https://ik.imagekit.io/couponluxury/b9eb2b42094811.57c019c4dd143_D0CjrE5ta.gif",
  ];
  const messages = [
    "You are about to leave the page. Are you sure you want to do that?",
    "Were you trying to leave the page?",
    "closing the exam wi",
  ];

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [remainingTime, setRemainingTime] = useState(COOLDOWN_PERIOD);
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const toast = useToast();

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "X") {
        document.removeEventListener("keydown", handleShortcut);
        onClose();
        toast({
          title: "Warning removed",
          description: "Please dont use this hack often!",
          duration: 7000,
        });
      }
    };
    window.addEventListener("blur", () => {
      document.addEventListener("keydown", handleShortcut);
      onOpen();
      setRemainingTime(COOLDOWN_PERIOD);

      if (timer) clearInterval(timer);
      setTimer(
        setInterval(() => {
          setRemainingTime((p) => p - 1);
        }, 1000)
      );
      const t = setTimeout(() => {
        onClose();
        toast({
          title: "Editor unlocked!",
          description: "Please follow the guidelines",
        });
        clearTimeout(t);
      }, COOLDOWN_PERIOD * 1000);
    });
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("keydown", handleShortcut);
    };
  }, [onClose, onOpen, timer, toast]);

  return (
    <Box>
      <Modal
        closeOnEsc={false}
        closeOnOverlayClick={false}
        onClose={onClose}
        size={"md"}
        isOpen={isOpen}
      >
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent>
          <ModalHeader>No cheating pls!!</ModalHeader>
          {/* <ModalCloseButton /> */}
          <ModalBody>
            <VStack justifyContent={"center"} alignContent={"center"}>
              <Image
                src={images[randIdx]}
                alt="Coding Ducks"
                style={{ borderRadius: "10px" }}
                width={300}
                height={300}
              />
              <Text
                fontWeight={"extrabold"}
                fontSize={"3xl"}
                textAlign={"center"}
              >
                Editor is locked for {remainingTime}s
              </Text>
              <Text
                fontWeight={"extrabold"}
                fontSize={"1xl"}
                textAlign={"center"}
              >
                Switching to other tabs or apps will disqualify you!
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default WarnOnTabLeave;

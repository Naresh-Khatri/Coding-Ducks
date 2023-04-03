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
} from "@chakra-ui/react";
import Image from "next/image";
import { useEffect } from "react";

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
  const randIdx = Math.floor(Math.random() * 2);

  const { isOpen, onOpen, onClose } = useDisclosure();
  useEffect(() => {
    window.addEventListener("blur", () => {
      onOpen();
    });
  }, [onOpen]);

  return (
    <Box>
      <Modal onClose={onClose} size={"md"} isOpen={isOpen}>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent>
          <ModalHeader>No cheating pls!!</ModalHeader>
          <ModalCloseButton />
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
                Switching to other tabs or apps will disqualify you!
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} colorScheme="purple">
              Okay
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default WarnOnTabLeave;

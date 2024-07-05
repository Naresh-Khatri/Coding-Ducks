import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

import Image from "next/image";
import confetti from "canvas-confetti";
import { useEffect } from "react";

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

interface UserUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}
function UserUpgradeModal({ isOpen, onClose }: UserUpgradeModalProps) {
  useEffect(() => {
    confetti({
      particleCount: 300,
      spread: 360,
      gravity: 0.5,
      shapes: ["circle", "circle", "square"],
      zIndex: 2000,
    });
  }, []);
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={"lg"}
        isCentered
        closeOnEsc={false}
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px) " />
        <ModalContent>
          {/* <ModalHeader>Congratulations!</ModalHeader> */}
          <ModalCloseButton />
          <ModalBody>
            <Flex align={"center"} direction={"column"} position={"relative"}>
              <Image
                style={{ position: "absolute", top: "-80px" }}
                src={"/assets/badges/tutorial-complete.svg"}
                width={200}
                height={200}
                alt="badge"
              />

              <Text
                mt={32}
                fontWeight="extrabold"
                fontSize="5xl"
                lineHeight={1.2}
                css={{
                  background: `linear-gradient(
        to right,
        #7953cd 20%,
        #00affa 30%,
        #0190cd 70%,
        #764ada 80%
    )`,
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  WebkitBackgroundClip: "text",
                  backgroundSize: "500% auto",
                  animation: `${gradientAnimation} 5s ease-in-out infinite alternate`,
                }}
              >
                You&apos;ve made it!
              </Text>
              <Text
                fontWeight={"extrabold"}
                fontSize={"lg"}
                textAlign={"center"}
                mt={11}
              >
                Tutorial is completed and all problems are unlocked!
              </Text>
              <Text mt={22}>
                As a reward for your hard work, you have also received a badge
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button
              rightIcon={<ChevronRightIcon />}
              colorScheme="purple"
              mr={3}
              onClick={onClose}
            >
              Continue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default UserUpgradeModal;

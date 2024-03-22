import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

function DuckletsOnboardingModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currStep, setCurrStep] = useState(0);
  const steps = [
    {
      title: "Your Interactive Coding Environment",
      description: "Write, run, and experiment with code in real-time",
      imgURL:
        "https://ik.imagekit.io/couponluxury/coding_ducks/gifs/4foo_lx4UUc_jv.gif",
    },
    {
      title: "Create a new Ducklet",
      description: "Click the + button to create a new Ducklet",
    },
    {
      title: "Choose a language",
      description: "Choose a language to start coding",
    },
    {
      title: "Run your code",
      description: "Click the run button to run your code",
    },
    {
      title: "Sharing is caring",
      description: "Share your Ducklet with your friends",
    },
  ];

  useEffect(() => {
    if (localStorage.getItem("duckletsOnboarding") === "true") return;
    onOpen();
  }, [onOpen]);

  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to Ducklets!</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack justify={"center"}>
            {steps.map((step, index) => (
              <Box
                key={index}
                borderRadius={10}
                w={8}
                p={1}
                h={1}
                bg={index < currStep + 1 ? "white" : "gray.800"}
                onClick={() => setCurrStep(index)}
                cursor={"pointer"}
              ></Box>
            ))}
          </HStack>
          <Flex
            minH={"400px"}
            direction={"column"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Flex>
              {steps.map((step, index) => {
                return (
                  <Box
                    key={index}
                    w={"50px"}
                    h={"50px"}
                    borderRadius={"50%"}
                    bg={step === steps[currStep] ? "blue.500" : "gray.300"}
                    mr={2}
                    onClick={() => setCurrStep(index)}
                    cursor={"pointer"}
                  ></Box>
                );
              })}
            </Flex>
            {/* <Heading size="md">Your Interactive Coding Environment</Heading> */}
            <Heading size="md">
              Write, run, and experiment with code in real-time
            </Heading>
          </Flex>
        </ModalBody>

        <ModalFooter justifyContent={"space-between"}>
          <Checkbox mr={3}>Dont show this again</Checkbox>
          <Box>
            <Button variant="outline" mr={3}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              rightIcon={<ChevronRightIcon />}
              onClick={onClose}
            >
              Next
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DuckletsOnboardingModal;

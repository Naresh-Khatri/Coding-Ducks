import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import React, { useEffect } from "react";

import confetti from "canvas-confetti";
import { StarIcon } from "@chakra-ui/icons";

const positiveImgs = [
  "https://ik.imagekit.io/couponluxury/86844d70936397.5bb439fbdbf6b_O3aiJ_elz.gif",
  "https://ik.imagekit.io/couponluxury/185d4d70936397.5bb439fbd97fc_fCcWMr1bG.gif",
  "https://ik.imagekit.io/couponluxury/4d576970936397.5bb439fbdc379_Xb4K44zuY.gif",
  "https://ik.imagekit.io/couponluxury/2d037c70936397.5bb439fbda19f_leAvQOZbz.gif",
];
const negativeImgs = [
  "https://ik.imagekit.io/couponluxury/0959c570936397.5bb439fbde3d2_lGsUwk-M9.gif",
  "https://ik.imagekit.io/couponluxury/63d98670936397.5bb439fbdfabb_jxOOxoUWlm.gif",
  "https://ik.imagekit.io/couponluxury/b9eb2b42094811.57c019c4dd143_D0CjrE5ta.gif",
  "https://ik.imagekit.io/couponluxury/614ab270936397.5bb439fbdab5d_BzKOTRnS-.gif",
];
function Submission({
  isOpen,
  onClose,
  passed,
  setCurrentProblemIdx,
  canGoToNextProblem,
}) {
  useEffect(() => {
    if (passed && typeof window !== "undefined")
      confetti({
        particleCount: 300,
        spread: 360,
        gravity: 0.5,
        shapes: ["circle", "circle", "square"],
        zIndex: 2000,
      });
  }, [passed]);
  const img = passed
    ? positiveImgs[Math.floor(Math.random() * positiveImgs.length)]
    : negativeImgs[Math.floor(Math.random() * negativeImgs.length)];
  const msg = passed ? "" : "Some test cases did not pass, check the console!";
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent minW={800} borderRadius={20} pb={5}>
        <ModalHeader>{passed ? "Success!" : "Try again!"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={2} spacing={10}>
            <Image
              src={img}
              width={300}
              height={300}
              alt="modal: duck says hi"
              style={{ borderRadius: "20px" }}
            />
            <Flex direction={"column"} justify="space-around">
              {passed ? (
                <Flex align={"center"} direction="column">
                  <Text fontSize={"3xl"} fontWeight={"extrabold"}>
                    Great job! All test cases passed!
                  </Text>
                  <HStack>
                    <Text fontSize={"6xl"} fontWeight={"extrabold"}>
                      +10
                    </Text>
                    <StarIcon color={"gold"} fontSize={"4xl"} />
                  </HStack>
                  <Text fontWeight={"extrabold"}>Added</Text>
                  <Flex mt={5}>
                    <Button
                      variant={"outline"}
                      w={"40"}
                      mr={3}
                      onClick={onClose}
                    >
                      Close
                    </Button>
                    {canGoToNextProblem && (
                      <Button
                        colorScheme="purple"
                        w={"40"}
                        mr={3}
                        onClick={() => {
                          setCurrentProblemIdx((prev) => prev + 1);
                          onClose();
                        }}
                        isDisabled={!canGoToNextProblem}
                      >
                        Next Problem
                      </Button>
                    )}
                  </Flex>
                </Flex>
              ) : (
                <>
                  <Text fontSize={"3xl"} fontWeight={"extrabold"}>
                    Some test cases did not pass, check the console!
                  </Text>
                  <Button colorScheme="purple" mr={3} onClick={onClose}>
                    Close
                  </Button>
                </>
              )}

              {/* <Button colorScheme="purple" mr={3} onClick={onClose}>
                Close
              </Button> */}
            </Flex>
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default Submission;

import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ScaleFade,
  Slide,
  SlideFade,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { faArrowsLeftRight, faExpand } from "@fortawesome/free-solid-svg-icons";
import FAIcon from "_components/FAIcon";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

function ImageDiff({
  targetImage,
  sourceImage,
  width = "full",
  height = "full",
}: {
  targetImage: string;
  sourceImage: string;
  width?: number | "auto" | "full";
  height?: number | "auto" | "full";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseActive, setMouseActive] = useState(false);
  const [diffWidth, setDiffWidth] = useState(100);
  const [containerWidth, setContainerWidth] = useState(0);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth);
  }, [containerRef.current]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!containerRef.current || ("clientX" in e && !mouseActive)) return;
    const foo = containerRef.current.getBoundingClientRect();
    let clientX: number;
    if ("clientX" in e) {
      clientX = e.clientX;
    } else {
      clientX = e.touches[0].clientX;
    }
    const newWidth = Math.max(0, Math.min(containerWidth, clientX - foo.left));
    setDiffWidth(newWidth);
  };
  // TODO: prevent dragging images

  useEffect(() => {
    setShowHints(true);
    const timer = setTimeout(() => {
      setShowHints(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [diffWidth]);

  return (
    <Box
      ref={containerRef}
      position={"relative"}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      w={width}
      h={height}
      onMouseDown={() => setMouseActive(true)}
      onMouseUp={() => setMouseActive(false)}
      userSelect={"none"}
    >
      <Image
        src={targetImage}
        width={4000}
        height={4000}
        draggable={false}
        alt="sourceImage image"
        style={{ width: "100%", height: "auto" }}
      />
      <Box pos={"absolute"} top={2} right={2} zIndex={0} className="hint">
        <SlideFade in={showHints} offsetX={"10px"}>
          <Text
            fontSize={"lg"}
            fontWeight={"bold"}
            borderRadius={"10px"}
            backdropBlur={"5px"}
            background={"#66666644"}
            p={2}
            px={4}
          >
            Target
          </Text>
        </SlideFade>
      </Box>
      <Center
        w="2px"
        h={"100%"}
        bg={"white"}
        pos={"absolute"}
        top={0}
        left={diffWidth + "px"}
        cursor={"col-resize"}
        background={"purple.400"}
      >
        <Flex
          pos={"relative"}
          h={height}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Box
            w={"2rem"}
            h={"3rem"}
            background={"#99999944"}
            backdropFilter={"blur(3px)"}
            borderRadius={"full"}
            zIndex={3}
            cursor={"col-resize"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            color={"black"}
          >
            <FAIcon icon={faArrowsLeftRight} />
          </Box>
        </Flex>
      </Center>
      <Box
        pos={"absolute"}
        top={0}
        left={0}
        w={diffWidth + "px"}
        h={height}
        overflowX={"hidden"}
      >
        <Box width={containerWidth} h={height}>
          <Box pos={"absolute"} top={2} left={2} zIndex={0} className="hint">
            <SlideFade in={showHints} offsetX={"-10px"}>
              <Text
                fontSize={"lg"}
                fontWeight={"bold"}
                borderRadius={"10px"}
                backdropBlur={"5px"}
                background={"#66666644"}
                p={2}
                px={4}
              >
                Output
              </Text>
            </SlideFade>
          </Box>
          <Image
            src={sourceImage}
            width={4000}
            height={4000}
            alt="source image"
            draggable={false}
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Box>
      <IconButton
        pos={"absolute"}
        bottom={2}
        right={2}
        aria-label="diff"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        isDisabled
        icon={<FAIcon icon={faExpand} />}
      />
      {/* <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant="ghost">Secondary Action</Button>
            </ModalFooter>
          </ModalContent>
        </Modal> */}
    </Box>
  );
}

export default ImageDiff;

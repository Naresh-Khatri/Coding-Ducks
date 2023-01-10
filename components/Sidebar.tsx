import {
  Box,
  Circle,
  Container,
  HStack,
  IconButton,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProblemSelector from "./ProblemSelector";
import { useState, useContext } from "react";
import ProblemContext from "../contexts/problemsContext";
function Sidebar() {
  const { problems, setCurrentProblemId } = useContext(ProblemContext);
  const [isHid, setIsHid] = useState(false);

  return (
    <Box bg={useColorModeValue("gray.100", "gray.900")} position="relative">
      <IconButton
        onClick={() => {
          setIsHid((p) => !p);
        }}
        icon={
          <FontAwesomeIcon
            color="black"
            size="1x"
            icon={isHid ? faArrowRight : faArrowLeft}
          />
        }
        position={"absolute"}
        left={-10}
        top={"40vh"}
        bg={"gray.200"}
        borderRadius="10px 0 0 10px"
      />
      {isHid && (
        <Container py={10} overflow="hidden">
          <Text>Questions</Text>
          <SimpleGrid
            mt={5}
            columns={5}
            spacing={5}
            maxW={"30vw"}
            // _hover={{ w: 150 }}
            // transition="all .1s ease-in"
          >
            {problems.map((problem, idx) => (
              <ProblemSelector
                key={idx}
                problemId={idx}
                isActive={idx == 10}
                isComplete={idx < 5}
              />
            ))}
          </SimpleGrid>
          <VStack alignItems={"start"} mt={5}>
            <HStack>
              <Circle w={3} h={3} bg={"blue.300"}></Circle>
              <Text> Active </Text>
            </HStack>
            <HStack>
              <Circle w={3} h={3} bg={"green.300"}></Circle>
              <Text> Answered (1)</Text>
            </HStack>
            <HStack>
              <Circle w={3} h={3} bg={"gray.300"}></Circle>
              <Text> Unattempted (21)</Text>
            </HStack>
            <Box w={"100%"}>
              <Text mt={10}>Completed</Text>
              <Slider
                min={0}
                max={100}
                defaultValue={30}
                isReadOnly
                pointerEvents={"none"}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                {/* <SliderThumb /> */}
              </Slider>
            </Box>
          </VStack>
        </Container>
      )}
    </Box>
  );
}

export default Sidebar;

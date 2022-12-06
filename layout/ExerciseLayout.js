import { useContext, useEffect } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import { userContext } from "../contexts/userContext";
import UserProfile from "../components/UserProfile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { exerciseContext } from "../contexts/exerciseContext";

function NavBar({ children }) {
  const { user, loading } = useContext(userContext);
  return (
    <Box as="header" position={"relative"}>
      <Box as="nav">
        <Flex px={{ base: 0, md: 10 }} py={2} justifyContent="space-between">
          <Heading>
            <Text></Text>
          </Heading>
          <HStack zIndex={999}>
            <ThemeToggler />
            {loading ? (
              <Text>Loading...</Text>
            ) : user ? (
              <UserProfile />
            ) : (
              <Link href="/login">
                <Button
                  color={"white"}
                  bg="purple.600"
                  _hover={{ bg: "purple.500" }}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </HStack>
        </Flex>
      </Box>
      {children}
    </Box>
  );
}

const ProblemSelector = ({ sectionIdx, problemIdx, isActive, isCompleted }) => {
  const {
    sections,
    currSection,
    currProblem,
    setCurrSection,
    setCurrProblem,
    setUserInputs,
  } = useContext(exerciseContext);

  const problem = sections[sectionIdx].problems[problemIdx];
  return (
    <Button
      w={"100%"}
      h={10}
      // leftIcon={<FontAwesomeIcon height={"2rem"} icon={faCheckCircle} />}
      // color="green.400"
      bg={
        sectionIdx == currSection && problemIdx == currProblem
          ? "gray.700"
          : "transparent"
      }
      justifyContent="start"
      onClick={() => {
        setUserInputs({})
        setCurrSection(sectionIdx);
        setCurrProblem(problemIdx);
      }}
    >
      {problem.id}. {problem.name}
    </Button>
  );
};

const ProblemSection = ({ sectionIdx }) => {
  const { sections, currSection, setCurrSection } = useContext(exerciseContext);
  return (
    <AccordionItem my={2}>
      <AccordionButton
        _expanded={{ bg: "gray.700" }}
        // bg={section.id == currSection ? "gray.700" : "transparent"}
        borderRadius={10}
        // onClick={() => setCurrSection(sectionIdx)}
      >
        <Box flex="1" textAlign="left">
          <Text fontWeight={"extrabold"}>{sections[sectionIdx].name}</Text>
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4}>
        <VStack>
          {sections[sectionIdx].problems.map((problem, problemIdx) => (
            <ProblemSelector
              key={problem.id}
              sectionIdx={sectionIdx}
              problemIdx={problemIdx}
            />
          ))}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
};

function ExerciseLayout({ children }) {
  const { sections, setCurrSection, currSection, currProblem } =
    useContext(exerciseContext);
  // console.log(currSection, currProblem);
  return (
    <>
      <NavBar>
        <Flex position={"absolute"} top={0} flexGrow={1} w={"100%"}>
          <Box
            as={"aside"}
            minW={"300px"}
            bg="blackAlpha.700"
            h={"100vh"}
            maxH={"100vh"}
            p={2}
          >
            <Center h={150}>
              <Text fontSize={"3xl"} fontWeight={"extrabold"}>
                Exercise 101
              </Text>
            </Center>
            <VStack>
              <Accordion w={"full"}>
                {sections.map((section, index) => (
                  <Box key={index}>
                    <ProblemSection sectionIdx={index} />
                  </Box>
                ))}
              </Accordion>
            </VStack>
          </Box>
          <Box as="main" w={"100%"} h={"100vh"} pt={75}>
            {children}
          </Box>
        </Flex>
      </NavBar>
    </>
  );
}

export default ExerciseLayout;

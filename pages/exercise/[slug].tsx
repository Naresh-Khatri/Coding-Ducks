import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import EditableCode from "../../components/EditableCode";
import {
  exerciseContext,
  ExerciseProvider,
} from "../../contexts/exerciseContext";
import ExerciseLayout from "../../layout/ExerciseLayout";

const ProblemStatement = () => {
  const { currProblem, sections, currSection } = useContext(exerciseContext);
  useEffect(() => {
    console.log(currProblem);
  }, [currProblem]);
  return (
    <Text
      fontSize={22}
      alignSelf="start"
      dangerouslySetInnerHTML={{
        __html: sections[currSection].problems[currProblem].statement,
      }}
    ></Text>
  );
};

function ExercisePage() {
  const { userInputs, sections, currProblem, currSection } =
    useContext(exerciseContext);
  return (
    <>
      <ExerciseProvider>
        <ExerciseLayout>
          <Flex
            align="center"
            justify={"space-evenly"}
            h={"100%"}
            direction="column"
            p={10}
          >
            <ProblemStatement />
            <Box>
              <EditableCode />
              <Button
                w={100}
                onClick={() => {
                  console.log(userInputs);
                }}
              >
                show vals
              </Button>
            </Box>
            <HStack w={"100%"} justify="space-around" mt={100}>
              <Button variant={"ghost"} disabled>
                Show answer
              </Button>
              <Button colorScheme={"green"}>Submit</Button>
            </HStack>
          </Flex>
        </ExerciseLayout>
      </ExerciseProvider>
    </>
  );
}

export default ExercisePage;

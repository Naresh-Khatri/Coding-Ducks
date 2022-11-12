import {
  Box,
  IconButton,
  SimpleGrid,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import ProblemSelector from "./ProblemSelector";

function Sidebar() {
  const [isHid, seTisHid] = useState(false);

  const problems = [
    {
      id: 1,
      title: `Suppose p is the number of cars per minute passing through a certain
         road junction between 5 PM and 6 PM, and p has a Poisson distribution with
         mean 3. What is the probability of observing fewer than 3 cars during 
         any given minute in this interval?`,
      options: [1, 2, 3, 4],
    },
  ];
  const arr = Array.from({ length: 30 }, (x, i) => i);
  return (
    <Box bg={useColorModeValue("gray.200", "gray.900")} position="relative">
      <IconButton
        onClick={() => {
          seTisHid((p) => !p);
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
        bg={useColorModeValue("white", "gray.200")}
        p={1}
        borderRadius="10px 0 0 10px"
      />
      {isHid && (
        <SimpleGrid
          columns={3}
          spacing={1.5}
          w={20}
          _hover={{ w: 150 }}
          transition="all .1s ease-in"
        >
          {arr.map((idx) => (
            <ProblemSelector
              key={idx}
              problem={idx}
              isActive={idx == 10}
              isComplete={idx < 5}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default Sidebar;

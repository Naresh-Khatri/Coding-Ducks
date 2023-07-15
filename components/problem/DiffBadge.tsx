import { Badge, Box, Flex, HStack, Text } from "@chakra-ui/react";
import React from "react";
import { IDifficulty } from "../../types";
import { DIFFICULTY_TO_COLOR } from "../../data/problems";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface DiffBadgeProps {
  difficulty: IDifficulty;
  size?: "sm" | "md" | "lg";
}

const diff = {
  tutorial: {
    label: "Basic",
    starCount: 0,
  },
  easy: {
    label: "Easy",
    starCount: 1,
  },
  medium: {
    label: "Medium",
    starCount: 2,
  },
  hard: {
    label: "Hard",
    starCount: 3,
  },
};

function DiffBadge({ difficulty, size }: DiffBadgeProps) {
  return (
    <Flex direction={"column"} alignItems={"center"} justifyContent={"center"}>
      {difficulty !== "tutorial" && (
        <HStack>
          {[1, 2, 3].map((i) => (
            <FontAwesomeIcon
              key={i}
              icon={faStar}
              color={
                i <= diff[difficulty].starCount
                  ? DIFFICULTY_TO_COLOR[difficulty].color
                  : "gray"
              }
              size={size === "sm" ? "xs" : size === "md" ? "sm" : "lg"}
            />
          ))}
        </HStack>
      )}
      <Box
        alignItems={"center"}
        display={"flex"}
        justifyContent={"center"}
        color={DIFFICULTY_TO_COLOR[difficulty].colorScheme}
      >
        <Text
          fontWeight={"extrabold"}
          color={DIFFICULTY_TO_COLOR[difficulty].color}
        >
          {diff[difficulty].label}
        </Text>
      </Box>
    </Flex>
  );
}

export default DiffBadge;

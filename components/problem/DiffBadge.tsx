import { Badge } from "@chakra-ui/react";
import React from "react";

interface DiffBadgeProps {
  difficulty: "easy" | "medium" | "hard";
  size?: "sm" | "md" | "lg";
}

function DiffBadge({ difficulty, size }: DiffBadgeProps) {
  return (
    <Badge
      size={size}
      colorScheme={`${
        difficulty === "easy"
          ? "green"
          : difficulty === "medium"
          ? "yellow"
          : "orange"
      }`}
    >
      {difficulty}
    </Badge>
  );
}

export default DiffBadge;

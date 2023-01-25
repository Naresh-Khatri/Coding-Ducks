import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import React from "react";

interface WindowHeaderProps {
  title: string;
  status: "error" | "success" | "none";
}

function WindowHeader({ title, status }: WindowHeaderProps) {
  return (
    <>
      <Flex
        h={"30px"}
        alignItems={"center"}
        bg={
          status === "error"
            ? "red.500"
            : status === "success"
            ? "green.500"
            : "transparent"
        }
        px={4}
        borderRadius="10px 10px 0 0"
      >
        <Box>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="54"
            height="14"
            viewBox="0 0 54 14"
          >
            <circle
              cx="6"
              cy="6"
              r="6"
              fill="#FF5F56"
              stroke="#E0443E"
              strokeWidth=".5"
            ></circle>
            <circle
              cx="26"
              cy="6"
              r="6"
              fill="#FFBD2E"
              stroke="#DEA123"
              strokeWidth=".5"
            ></circle>
            <circle
              cx="46"
              cy="6"
              r="6"
              fill="#27C93F"
              stroke="#1AAB29"
              strokeWidth=".5"
            ></circle>
          </svg>
        </Box>
        <Spacer />
        <Text>{title}</Text>
        <Spacer />
        <Box></Box>
      </Flex>
    </>
  );
}

export default WindowHeader;

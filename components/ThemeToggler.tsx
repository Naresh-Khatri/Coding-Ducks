import { IconButton, useColorMode, useToast } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLightbulb, faMoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

function ThemeToggler() {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  return (
    <IconButton
      aria-label="Toggle theme"
      icon={
        <FontAwesomeIcon
          icon={colorMode === "light" ? faMoon : (faLightbulb as IconProp)}
          height={"1.2rem"}
        />
      }
      onClick={() => {
        if (colorMode === "dark")
          toast({
            title: `Light theme not supported.`,
            description: `Some components may not look good in light theme.`,
            status: "info",
            duration: 7000,
            position: "top",
            isClosable: true,
          });
        toggleColorMode();
      }}
    />
  );
}

export default ThemeToggler;

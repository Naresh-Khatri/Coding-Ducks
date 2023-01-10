import { IconButton, useColorMode } from "@chakra-ui/react";
import { faLightbulb, faMoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

function ThemeToggler() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      icon={
        <FontAwesomeIcon
          icon={colorMode === "light" ? faMoon : faLightbulb}
          height={"1.2rem"}
        />
      }
      onClick={toggleColorMode}
    />
  );
}

export default ThemeToggler;

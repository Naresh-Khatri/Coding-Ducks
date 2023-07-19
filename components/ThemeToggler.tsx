import { IconButton, useColorMode, useToast } from "@chakra-ui/react";
import { faLightbulb, faMoon } from "@fortawesome/free-solid-svg-icons";
import FAIcon from "./FAIcon";

function ThemeToggler() {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  return (
    <IconButton
      aria-label="Toggle theme"
      icon={<FAIcon icon={colorMode === "light" ? faMoon : faLightbulb} />}
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

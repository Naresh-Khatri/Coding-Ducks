import {
  Box,
  chakra,
  useColorModeValue,
  VisuallyHidden,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import {
  ButtonGroup,
  Container,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import * as React from "react";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const Footer = () => (
  <Box
    mt={10}
    bg={useColorModeValue("gray.50", "gray.900")}
    color={useColorModeValue("gray.700", "gray.200")}
    alignContent={"end"}
    justifySelf={"end"}
  >
    <Container
      as={Stack}
      maxW={"6xl"}
      py={4}
      direction={{ base: "column", md: "row" }}
      spacing={4}
      justify={{ base: "center", md: "space-between" }}
      align={{ base: "center", md: "center" }}
    >
      <Text>© 2023 Coding ducks. All rights reserved</Text>
      <ButtonGroup variant="ghost">
        <IconButton
          as="a"
          href="https://www.linkedin.com/naresh-khatri"
          aria-label="LinkedIn"
          icon={
            <FontAwesomeIcon height={"1.2rem"} icon={faLinkedin as IconProp} />
          }
        />
        <IconButton
          as="a"
          href="https://www.github.com/naresh-khatri"
          aria-label="GitHub"
          icon={
            <FontAwesomeIcon height={"1.2rem"} icon={faGithub as IconProp} />
          }
        />
        <IconButton
          as="a"
          href="https://www.twitter.com/naresh-khatri"
          aria-label="Twitter"
          icon={
            <FontAwesomeIcon height={"1.2rem"} icon={faTwitter as IconProp} />
          }
        />
      </ButtonGroup>
    </Container>
  </Box>
);

export default Footer;

const SocialButton = ({
  children,
  label,
  href,
}: {
  children: ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <chakra.button
      bg={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}
      rounded={"full"}
      w={8}
      h={8}
      cursor={"pointer"}
      as={"a"}
      href={href}
      display={"inline-flex"}
      alignItems={"center"}
      justifyContent={"center"}
      transition={"background 0.3s ease"}
      _hover={{
        bg: useColorModeValue("blackAlpha.200", "whiteAlpha.200"),
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

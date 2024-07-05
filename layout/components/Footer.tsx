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
import FAIcon from "../../_components/FAIcon";

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
      <Text>
        © {new Date().getFullYear()} Coding ducks. All rights reserved
      </Text>
      <ButtonGroup variant="ghost">
        <IconButton
          as="a"
          href="https://www.linkedin.com/naresh-khatri"
          aria-label="LinkedIn"
          // icon={<FAIcon icon={faLinkedin} />}
        />
        <IconButton
          as="a"
          href="https://www.github.com/naresh-khatri"
          aria-label="GitHub"
          // icon={<FAIcon icon={faGithub} />}
        />
        <IconButton
          as="a"
          href="https://www.twitter.com/naresh-khatri"
          aria-label="Twitter"
          // icon={<FAIcon icon={faTwitter} />}
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

import {
  Button,
  ButtonGroup,
  Container,
  Divider,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import * as React from "react";
// import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Icon, IconProp } from "@fortawesome/fontawesome-svg-core";

const Footer = () => (
  <Container as="footer" role="contentinfo" maxW={"7xl"}>
    <Stack
      spacing="8"
      direction={{ base: "column", md: "row" }}
      justify="space-between"
      py={{ base: "12", md: "16" }}
    >
      <Stack spacing={{ base: "6", md: "8" }} align="start">
        <Text
          fontSize="3xl"
          fontWeight="bold"
          lineHeight={0}
          color="purple.600"
        >
          Coding Ducks
        </Text>
        <Text color="muted" lineHeight={0}>
          Learn to code remarkably fast.
        </Text>
      </Stack>
      <Stack
        direction={{ base: "column-reverse", md: "column", lg: "row" }}
        spacing={{ base: "12", md: "8" }}
      ></Stack>
    </Stack>
    <Divider />
    <Stack
      pt="8"
      pb="12"
      justify="space-between"
      direction={{ base: "column-reverse", md: "row" }}
      align="center"
    >
      <Text fontSize="sm" color="subtle">
        &copy; {new Date().getFullYear()} Coding Ducks, Inc. All rights
        reserved.
      </Text>
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
    </Stack>
  </Container>
);

export default Footer;

import React, { useContext, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import Footer from "./components/Footer";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import { userContext } from "../contexts/userContext";
import UserProfile from "../components/UserProfile";
import { useRouter } from "next/router";

function NormalLayout({ children }) {
  return (
    <>
      <Flex direction={"column"} flex="1">
        <NavBar />
        <Box as="main">{children}</Box>
        <Footer />
      </Flex>
    </>
  );
}

const links = [
  { name: "Home", href: "/" },
  { name: "Users", href: "/users" },
  { name: "Tests", href: "/home" },
  { name: "Playground", href: "/playground" },
];

function NavBar() {
  const { user, loading } = useContext(userContext);

  return (
    <Box as="header">
      <Box as="nav">
        <Flex
          px={{ base: 0, md: 10 }}
          py={2}
          justifyContent="space-between"
          align={"center"}
        >
          <Heading>
            <Text fontSize={"3xl"}>Coding ducks🦆</Text>
          </Heading>
          <HStack as={"nav"}>
            {links.map((link) => (
              <NavLink key={link.name} href={link.href}>
                {link.name}
              </NavLink>
            ))}
          </HStack>
          <HStack>
            <ThemeToggler />
            {loading ? (
              <Text>Loading...</Text>
            ) : Object.keys(user).length > 0 ? (
              <UserProfile />
            ) : (
              <Link href="/login">
                <Button
                  color={"white"}
                  bg="purple.600"
                  _hover={{ bg: "purple.500" }}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}

const NavLink = ({ children, href }) => {
  const router = useRouter();
  console.log();
  return (
    <Link
      px={2}
      py={1}
      rounded={"md"}
      _hover={{
        textDecoration: "none",
        bg: useColorModeValue("gray.200", "gray.700"),
      }}
      href={href}
    >
      <Button
        variant={router.pathname === href ? "solid" : "ghost"}
        colorScheme="purple"
      >
        {children}
      </Button>
    </Link>
  );
};
export default NormalLayout;

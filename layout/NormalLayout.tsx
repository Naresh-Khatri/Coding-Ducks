import React, { ReactNode, useContext, useEffect } from "react";
import {
  Box,
  Button,
  Container,
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
import { auth } from "../firebase/firebase";
import Image from "next/image";

function NormalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Flex
        direction={"column"}
        justifyContent={"space-between"}
        flex="1"
        minH={"100vh"}
      >
        <NavBar />
        <Box as="main">{children}</Box>
        <Footer />
      </Flex>
    </>
  );
}

const links = [
  { name: "Problems", href: "/problems" },
  { name: "Users", href: "/users" },
  { name: "Tests", href: "/home" },
  { name: "Playground", href: "/playground" },
  { name: "Multiplayer", href: "/multiplayer" },
];

function NavBar() {
  const { user, loading } = useContext(userContext);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(user);
      } else {
        console.log("no user");
      }
    });
  }, []);

  return (
    <Container maxW="container.xl" as={"header"}>
      <Box as="nav">
        <Flex py={2} justifyContent="space-between" align={"center"}>
          <Link href={"https://codingducks.live"}>
            <Image
              src={"/assets/badges/logo.png"}
              width={175}
              height={175}
              alt={"logo"}
            />
            {/* <Heading>
              <Text fontSize={"2xl"}>Coding ducks🦆</Text>
            </Heading> */}
          </Link>
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
    </Container>
  );
}

const NavLink = ({ children, href }) => {
  const router = useRouter();
  console.log();
  return (
    <Link href={href} style={{ margin: "0 .5em" }}>
      <Button
        px={2}
        py={1}
        rounded={"md"}
        variant={router.pathname === href ? "solid" : "ghost"}
        _hover={{
          textDecoration: "none",
          bg: useColorModeValue("gray.200", "gray.700"),
        }}
        colorScheme="purple"
      >
        {children}
      </Button>
    </Link>
  );
};
export default NormalLayout;

import React, { useContext, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";

import Footer from "./components/Footer";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import { userContext } from "../contexts/userContext";
import UserProfile from "../components/UserProfile";

function NavBar() {
  const { user } = useContext(userContext);

  // useEffect(() => {
  //   console.log("user", user);
  // }, [user]);

  // console.log(user);
  return (
    <Box as="header">
      <Box as="nav">
        <Flex px={{ base: 0, md: 10 }} py={2} justifyContent="space-between">
          <Heading>
            <Text></Text>
          </Heading>
          <HStack>
            <ThemeToggler />
            {Object.keys(user).length ? (
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

export default NormalLayout;

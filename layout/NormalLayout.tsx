import React, { ReactNode } from "react";
import {
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";

import Footer from "./components/Footer";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import { useRouter } from "next/router";
import Image from "next/image";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";

function NormalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Flex
        direction={"column"}
        justifyContent={"space-between"}
        flex="1"
        minH={"100vh"}
      >
        <Container
          maxW="container.xl"
          height={"fit-content"}
          display={"flex"}
          flexDirection={"column"}
        >
          <Flex w={"100%"} display={{ base: "none", md: "flex" }}>
            <DesktopNavBar />
          </Flex>
          <Flex
            w={"100%"}
            direction={"column"}
            display={{ base: "flex", md: "none" }}
          >
            <MobileNavBar />
          </Flex>
          <Flex as="main" flex={1}>
            {children}
          </Flex>
        </Container>
      </Flex>
      <Footer />
    </>
  );
}

const links = [
  { label: "Problems", href: "/problems" },
  { label: "Users", href: "/users" },
  { label: "Exams", href: "/exams" },
  { label: "Playground", href: "/playground" },
  { label: "Multiplayer", href: "/multiplayer" },
];

function MobileNavBar() {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <>
      <Flex w={"100%"} justifyContent="space-between" align={"center"}>
        <IconButton
          onClick={onToggle}
          icon={
            isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
          }
          variant={"ghost"}
          aria-label={"Toggle Navigation"}
        />
        <Link href={"https://codingducks.live"}>
          <Image
            src={
              "https://ik.imagekit.io/couponluxury/coding_ducks/tr:w-200/logo_E_BOxGUcc.png"
            }
            width={175}
            height={175}
            alt={"logo"}
          />
        </Link>
        <UserProfile />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Flex direction={"column"} alignItems={"center"} my={5}>
          {links.map((link) => (
            <MobileNavItem key={link.label} {...link} />
          ))}
          <ThemeToggler />
        </Flex>
      </Collapse>
    </>
  );
}
interface NavItem {
  label: string;
  href?: string;
}
const MobileNavItem = ({ label, href }: NavItem) => {
  const router = useRouter();
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
        {label}
      </Button>
    </Link>
  );
};

function DesktopNavBar() {
  return (
    <Flex
      py={"0.2rem"}
      w={"100%"}
      justifyContent="space-between"
      align={"center"}
    >
      <Link href={"https://codingducks.live"}>
        <Image
          src={
            "https://ik.imagekit.io/couponluxury/coding_ducks/tr:w-200/logo_E_BOxGUcc.png"
          }
          priority
          width={175}
          height={175}
          alt={"logo"}
          style={{ height: "2.5rem", width: "auto" }}
        />
      </Link>
      <HStack>
        {links.map((link) => (
          <NavLink key={link.label} label={link.label} href={link.href} />
        ))}
      </HStack>
      <HStack>
        <ThemeToggler />
        <UserProfile />
      </HStack>
    </Flex>
  );
}

const NavLink = ({ label, href }) => {
  const router = useRouter();
  return (
    <Link href={href} style={{ margin: "0 .5em" }} shallow>
      <Button
        px={2}
        rounded={"md"}
        variant={router.pathname === href ? "solid" : "ghost"}
        _hover={{
          textDecoration: "none",
          bg: useColorModeValue("gray.200", "gray.700"),
        }}
        colorScheme="purple"
      >
        <Text fontSize={"sm"}>{label}</Text>
      </Button>
    </Link>
  );
};
export default NormalLayout;

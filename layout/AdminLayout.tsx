import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spacer,
  Text,
  useToast,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import ThemeToggler from "../_components/ThemeToggler";
import UserProfile from "../_components/UserProfile";
import { userContext } from "../contexts/userContext";

const LINKS = [
  {
    name: "dashboard",
    label: "Dashboard",
    link: "/dashboard",
  },
  {
    name: "exams",
    label: "Exams",
    link: "/dashboard/exams",
  },
  {
    name: "problems",
    label: "Problems",
    link: "/dashboard/problems",
  },
  {
    name: "add-problem",
    label: "Add Problems",
    link: "/dashboard/add-problem",
  },
  {
    name: "submissions",
    label: "Problem Submissions",
    link: "/dashboard/problem-submissions",
  },
  {
    name: "exercises",
    label: "Exercises",
    link: "/dashboard/exercises",
    disabled: true,
  },
  {
    name: "challenges",
    label: "UI Challenges",
    link: "/dashboard/ui-challenges",
  },
  {
    name: "add-hallenges",
    label: "Add UI Challenges",
    link: "/dashboard/add-ui-challenge",
  },
];
function AdminLayout({ children }) {
  const { user } = useContext(userContext);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    //TODO: add better redirect logic user is not logged in
    if (user && !user?.isAdmin) {
      toast({
        title: "You are not authorized to view this page",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      router.push("/problems");
    }
  });

  return (
    <Flex direction={"column"} h={"100vh"}>
      <Flex
        as="nav"
        alignItems={"center"}
        bg="purple.600"
        color={"white"}
        w={"100vw"}
        px={2}
        h={"70px"}
      >
        <HStack alignItems={"center"} h={"70px"}>
          <IconButton aria-label="idk" bg={"transparent"} />
          <Text fontSize="20px" fontWeight={"extrabold"} noOfLines={1}>
            Dashboard
          </Text>
        </HStack>
        <Spacer />
        <Box></Box>
        <Spacer />
        <HStack>
          <ThemeToggler />
          <UserProfile />
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        <Flex
          direction={"column"}
          width={"350px"}
          h="100%"
          bg={"gray.900"}
          py={10}
          px={5}
          w={"250px"}
        >
          {LINKS.map((link) => (
            <Link href={link.link} key={link.name}>
              <Button
                disabled={link.disabled}
                colorScheme="purple"
                variant={router.pathname === link.link ? "solid" : "ghost"}
                fontWeight={"extrabold"}
                fontSize={"1xl"}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </Flex>
        {children}
      </Flex>
    </Flex>
  );
}

export default AdminLayout;

import {
  Box,
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
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import { userContext } from "../contexts/userContext";

function AdminLayout({ children }) {
  const { user } = useContext(userContext);

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    //TODO: add better redirect logic user is not logged in
    if (Object.keys(user).length && !user?.isAdmin) {
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
          <Link href={"/dashboard"}>
            <Box bg={"purple.800"} px={8} py={5} borderRadius={20} my={2}>
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Dashboard
              </Text>
            </Box>
          </Link>
          <Link href={"/dashboard/exams"}>
            <Box bg={"purple.800"} px={8} py={5} borderRadius={20} my={2}>
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Exams
              </Text>
            </Box>
          </Link>
          <Link href={"/dashboard/problems"}>
            <Box bg={"purple.800"} px={8} py={5} borderRadius={20} my={2}>
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Problems
              </Text>
            </Box>
          </Link>
          <Link href={"/dashboard/add-problem"}>
            <Box bg={"purple.800"} px={8} py={5} borderRadius={20} my={2}>
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Add problem
              </Text>
            </Box>
          </Link>
          <Link href={"/dashboard/exercises"}>
            <Box
              bg={"purple.800"}
              px={8}
              py={5}
              borderRadius={20}
              my={2}
              _disabled={{ bg: "purple.800" }}
            >
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Exercises
              </Text>
            </Box>
          </Link>
          <Link href={"/dashboard/submissions"}>
            <Box
              bg={"purple.800"}
              px={8}
              py={5}
              borderRadius={20}
              my={2}
              _disabled={{ bg: "purple.800" }}
            >
              <Text fontWeight={"extrabold"} fontSize={"1xl"}>
                Submissions
              </Text>
            </Box>
          </Link>
        </Flex>
        {children}
      </Flex>
    </Flex>
  );
}

export default AdminLayout;

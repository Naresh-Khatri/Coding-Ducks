import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  LightMode,
  Spacer,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { faLightbulb, faMoon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ProfileInfo from "../components/ProfileInfo";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  const { colorMode, toggleColorMode } = useColorMode();
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
          <IconButton bg={"transparent"} />
          <Text fontSize="20px" fontWeight={"extrabold"} noOfLines={1}>
            Dashboard
          </Text>
        </HStack>
        <Spacer />
        <Box></Box>
        <Spacer />
        <HStack>
          <Avatar
            name="Kola Tioluwani"
            src="https://bit.ly/tioluwani-kolawole"
          />
          <IconButton
            bg={colorMode === "light" ? "grey.900" : "grey.300"}
            _hover={{ bg: colorMode === "light" ? "grey.900" : "grey.300" }}
            icon={
              <FontAwesomeIcon
                icon={colorMode === "light" ? faMoon : faLightbulb}
              />
            }
            onClick={toggleColorMode}
          />
          <ProfileInfo />
          <Button variant={"solid"} bg={"red.400"}>
            Logout
          </Button>
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        <Flex
          direction={"column"}
          width={"350px"}
          h="100%"
          bg={"gray.900"}
          p={10}
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
        </Flex>
        {children}
      </Flex>
    </Flex>
  );
}

export default MainLayout;

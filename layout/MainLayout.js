import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spacer,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Flex h="80vh" flexDir={"column"}>
      <Flex
        as="nav"
        alignItems={"center"}
        h={70}
        px={2}
        bg="brand.900"
        color={"white"}
        w={"100vw"}
      >
        <HStack alignItems={"center"}>
          <IconButton bg={"transparent"} />
          <Text>Coding Ducks</Text>
        </HStack>
        <Spacer />
        <Box>
          <Text> 00:10:43 </Text>
        </Box>
        <Spacer />
        <HStack>
          <Text>97/100</Text>
          <Flex flexDir={"column"}>
            <Text>naresh khatri</Text>
            <Text>19fh1a0546</Text>
          </Flex>
          <Avatar
            name="Kola Tioluwani"
            src="https://bit.ly/tioluwani-kolawole"
          />
          <IconButton
            bg={"transparent"}
            icon={
              <FontAwesomeIcon icon={colorMode === "light" ? faSun : faMoon} />
            }
            onClick={toggleColorMode}
          />
          <Button variant={"solid"} bg={"red.400"}>
            Logout
          </Button>
        </HStack>
      </Flex>
      <Flex w={"100vw"} h={"80%"} justifyContent="space-between">
        {children}
        <Sidebar />
      </Flex>
    </Flex>
  );
}

export default MainLayout;

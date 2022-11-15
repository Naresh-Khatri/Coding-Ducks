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
            Coding karlo frenzzzz
          </Text>
        </HStack>
        <Spacer />
        <Box>
          <Text fontWeight={"extrabold"}> 00:10:43 </Text>
        </Box>
        <Spacer />
        <HStack>
          <Text fontWeight={"extrabold"}>97/100</Text>
          <Flex flexDir={"column"}>
            <Text fontWeight={"extrabold"}>naresh khatri</Text>
            <Text fontWeight={"extrabold"}>19fh1a0546</Text>
          </Flex>
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
        <Sidebar />
        {children}
      </Flex>
    </Flex>
  );
}

export default MainLayout;

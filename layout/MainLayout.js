import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useContext } from "react";
// import Sidebar from "../components/Sidebar";
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import { submissionsContext } from "../contexts/submissionsContext";

function MainLayout({ children }) {
  const { totalMarks, marks } = useContext(submissionsContext);
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
          <Text fontWeight={"extrabold"}>
            {marks}/{totalMarks}
          </Text>
          <ThemeToggler />
          <UserProfile />

          <Button variant={"solid"} bg={"red.400"}>
            Finish
          </Button>
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        {/* <Sidebar /> */}
        {children}
      </Flex>
    </Flex>
  );
}

export default MainLayout;

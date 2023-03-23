import { Flex, HStack, IconButton, Spacer, Text } from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faClock, faHome, faLeftLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ThemeToggler from "../components/ThemeToggler";
import UserProfile from "../components/UserProfile";
import { useExamSubmissionsData } from "../hooks/useExamsData";
import Timer from "../components/Timer";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  examId: number;
}
//this fucntion takes examId to show the marks obtained in the exam
function MainLayout({ children, title, examId }: MainLayoutProps) {
  const { data: submissionData } = useExamSubmissionsData(examId);
  const { totalMarks, marksObtained } = submissionData?.data || {
    totalMarks: 0,
    marksObtained: 0,
  };
  return (
    <Flex direction={"column"} h={"100vh"}>
      <Flex
        as="nav"
        alignItems={"center"}
        // bg="purple.600"
        // color={"white"}
        w={"100vw"}
        px={2}
        h={"70px"}
      >
        <HStack alignItems={"center"} h={"70px"}>
          <Link href={"/home"}>
            <IconButton
              aria-label="Go back"
              bg={"transparent"}
              icon={
                <FontAwesomeIcon
                  height={"1.2rem"}
                  icon={faLeftLong as IconProp}
                />
              }
            />
          </Link>
          <Link href={"/"}>
            <IconButton
              aria-label="Go home"
              bg={"transparent"}
              icon={
                <FontAwesomeIcon height={"1.2rem"} icon={faHome as IconProp} />
              }
            />
          </Link>
          <Text fontSize="20px" fontWeight={"extrabold"} noOfLines={1}>
            {title}
          </Text>
        </HStack>
        <Spacer />
        <Timer />
        <Spacer />
        <HStack>
          <Text fontWeight={"extrabold"}>
            {marksObtained}/{totalMarks}
          </Text>
          <ThemeToggler />
          <UserProfile />

          {/* <Button variant={"solid"} bg={"red.400"} disabled>
            Finish
          </Button> */}
        </HStack>
      </Flex>
      <Flex w={"100vw"} flexGrow={1} overflowY="hidden">
        {children}
      </Flex>
    </Flex>
  );
}

export default MainLayout;

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Center,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import FileExplorer from "./FileExplorer";
import useGlobalStore from "../../stores";
import Split from "react-split";

function SideBar() {
  // const currRoom = useGlobalStore((state) => state.currRoom);
  return (
    <Split
      style={{ height: "100%", width: "100%" }}
      direction="vertical"
      minSize={200}
      sizes={[40, 60]}
    >
      <Box h={"100%"} w={"100%"} style={{ background: "#1e1e1e" }}>
        <Accordion allowToggle>
          <AccordionItem border={"none"}>
            <AccordionButton>
              <Flex as="span" flex="1" textAlign="left">
                <Text>room:</Text>
                <Text fontWeight={"bold"} ml={"1rem"}>
                  {/* {currRoom.name} */}
                </Text>
                <Text color={"whiteAlpha.500"} ml={".3rem"}>
                  {/* (#{currRoom.id}) */}
                </Text>
              </Flex>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <HStack>
                <Text fontWeight={"bold"}>[ROOM INFO]</Text>
              </HStack>
              <HStack>
                <Text fontWeight={"bold"}>Owner: </Text>
                {/* <Text>{currRoom.owner?.username}</Text> */}
              </HStack>
              <HStack>
                <Text fontWeight={"bold"}>Created: </Text>
                {/* <Text>{currRoom.createdAt.toString()}</Text> */}
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <FileExplorer />
      </Box>
      <Center bg={"#1d1d1d"}>
        <Text color={"whiteAlpha.300"}>Chat will come here!</Text>
      </Center>
    </Split>
  );
}

export default SideBar;

import {
  Button,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Select,
  Stack,
  Text,
  VStack,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import React from "react";
import FAIcon from "../FAIcon";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

function ShareMenu() {
  const { hasCopied, onCopy } = useClipboard(window.location.href);
  const toast = useToast();
  return (
    <>
      <Button
        onClick={() => {
          onCopy();
          toast({
            title: "Link Copied",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }}
        variant={"ghost"}
        size={"sm"}
        aria-label="share button"
        leftIcon={<FAIcon icon={faArrowUpFromBracket} />}
      >
        Share
      </Button>
    </>
  );
  return (
    <Menu>
      <MenuButton
        as={Button}
        colorScheme="purple"
        leftIcon={<FAIcon icon={faArrowUpFromBracket} />}
      >
        Share
      </MenuButton>
      <MenuList p={"1rem"}>
        <Text fontWeight={"bold"}> Share this ducklet</Text>
        {/* 
        <VStack>
          <Text> People with access (WIP)</Text>
        </VStack>
        <VStack>
          <Text fontWeight={"bold"}> Collaboration Link</Text>

          <Select value={"everyone"} onChange={() => {}}>
            <option value="everyone">Everyone</option>
            <option value="private"> Only you and your friends</option> 
          </Select> 
        </VStack> */}
      </MenuList>
    </Menu>
  );
}

export default ShareMenu;

import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Collapse,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import React, { ReactNode, useCallback, useState } from "react";

function ContextMenu({ children }: { children: ReactNode }) {
  //   const [isOpen, setIsOpen] = useState(false);
  const { isOpen, onClose, onOpen, onToggle } = useDisclosure();

  //   const handleContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
  //     e.preventDefault();
  //     onToggle();
  //     console.log("hi there");
  //   }, []);
  return (
    <>
      <Menu isOpen={isOpen} onClose={onClose}>
        <Box
          w={"100%"}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpen();
          }}
        >
          {children}
        </Box>
        <MenuList
        //   onAnimationEnd={(e) => {
        //     const menu = document.querySelector("[role=menu]");
        //     menu.focus();
        //   }}
        >
          <MenuItem>Download</MenuItem>
          <MenuItem>Create a Copy</MenuItem>
          <MenuItem>Mark as Draft</MenuItem>
          <MenuItem>Delete</MenuItem>
          <MenuItem>Attend a Workshop</MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}

export default ContextMenu;

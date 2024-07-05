import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Box,
  Collapse,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import FAIcon from "../FAIcon";
import {
  faEllipsisH,
  faFolder,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { IDirectory, IFile } from "../../lib/socketio/socketEventTypes";
import useGlobalStore from "../../stores";
import FileIcons from "./FileIcons";

interface File {
  name: string;
  ext: "js" | "ts" | "cpp" | "json" | "gitignore" | "tsx";
}

function FileExplorer() {
  // const currRoom = useGlobalStore((state) => state.currRoom);
  const fileSystemTree = useGlobalStore((state) => state.fileSystemTree);
  // const lastOpenedFileId = useGlobalStore((state) => state.lastOpenedFileId);
  const selectFile = useGlobalStore((state) => state.selectFile);

  console.log(fileSystemTree);
  if (!fileSystemTree) return <p> loading...</p>;
  // useEffect(() => {
  //   // if (!currRoom || !lastOpenedFileId) return;
  //   selectFile(lastOpenedFileId);
  // }, [, /*currRoom*/ lastOpenedFileId]);
  return (
    <Box userSelect={"none"} w={"100%"}>
      <Directory dir={fileSystemTree[0]} depth={1} />
      <Text as={"pre"} fontSize={"sm"}>
        {/* {JSON.stringify(fileSystemTree[0], null, 2)} */}
      </Text>
    </Box>
  );
}
const Directory = ({ dir, depth }: { dir: IDirectory; depth: number }) => {
  const {
    isOpen: isDirOpen,
    onOpen: onDirOpen,
    onToggle: onDirToggle,
    onClose: onDirClose,
  } = useDisclosure();

  const {
    isOpen: isHovering,
    onOpen: onStartHovering,
    onClose: onEndHovering,
  } = useDisclosure();
  useEffect(() => {
    if (dir.name === "root") onDirOpen();
  }, []);
  return (
    <>
      <HStack cursor={"pointer"} onClick={onDirToggle} pos={"relative"}>
        <HStack
          w={"100%"}
          border={"1px solid #00000000"}
          _hover={{ border: "1px solid grey" }}
          onMouseEnter={onStartHovering}
          onMouseLeave={onEndHovering}
          bg={dir.isActive && !isDirOpen ? "purple.900" : "none"}
        >
          <Box w={`${depth}rem`}></Box>
          <ChevronRightIcon style={{ rotate: isDirOpen ? "90deg" : "0deg" }} />
          <Box
            opacity={dir.childDirs.length > 0 || dir.files.length > 0 ? 1 : 0.5}
          >
            <FAIcon icon={isDirOpen ? faFolderOpen : faFolder} />
          </Box>
          <Text fontSize={"1rem"} fontWeight={"bold"} fontFamily={"monospace"}>
            {dir.name}
          </Text>
        </HStack>
        <HStack pos={"absolute"} right={"0px"}>
          <Menu>
            {isHovering && (
              <MenuButton
                onMouseEnter={onStartHovering}
                onMouseLeave={onEndHovering}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                p={1}
                mr={1}
                bg={"#1e1e1e"}
                h={"1.5rem"}
                borderRadius={"6px"}
                border={"1px solid #00000000"}
                _hover={{ border: "1px solid grey" }}
              >
                <FAIcon icon={faEllipsisH} />
              </MenuButton>
            )}
            <Portal>
              <MenuList>
                <MenuItem isDisabled>Rename</MenuItem>
                <MenuItem isDisabled>Duplicate</MenuItem>
                <MenuItem isDisabled>Delete</MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </HStack>
      </HStack>
      <Collapse in={isDirOpen}>
        {dir.childDirs &&
          dir.childDirs.map((d, i) => {
            return <Directory key={i} dir={d} depth={depth + 1} />;
          })}

        {dir.files &&
          dir.files.map((file) => (
            <File key={file.id} depth={depth + 1} file={file} />
          ))}
      </Collapse>
    </>
  );
};

const File = ({ file, depth }: { file: IFile; depth: number }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isActive, fileName, lang } = file;
  const selectFile = useGlobalStore((state) => state.selectFile);

  return (
    <HStack
      cursor={"pointer"}
      direction={"row"}
      justifyContent={"space-between"}
      position={"relative"}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onClick={(e) => selectFile(file.id)}
    >
      <HStack
        border={"1px solid #00000000"}
        _hover={{ border: "1px solid grey" }}
        w={"100%"}
        bg={isActive ? "purple.800" : "none"}
        color={isActive ? "white" : "white"}
      >
        <Box w={`${1.5 + depth}rem`}></Box>
        <FileIcons fileName={fileName} width={17} />
        <Text fontSize={"1rem"} fontFamily={"monospace"}>
          {fileName}
        </Text>
      </HStack>
      <HStack pos={"absolute"} right={"0px"}>
        <Menu>
          {isOpen && (
            <MenuButton
              p={1}
              mr={1}
              bg={"#1e1e1e"}
              h={"1.5rem"}
              borderRadius={"6px"}
              _hover={{ bg: "gray.400" }}
              // onClick={(e: ReactEventHandler)=>}
            >
              <FAIcon icon={faEllipsisH} />
            </MenuButton>
          )}
          <Portal>
            <MenuList>
              <MenuItem isDisabled>Rename</MenuItem>
              <MenuItem isDisabled>Duplicate</MenuItem>
              <MenuItem isDisabled>Delete</MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </HStack>
    </HStack>
  );
};

export default FileExplorer;

import { Box, HStack, Text } from "@chakra-ui/react";
import FileIcons from "../multiplayer/FileIcons";
import { ReactNode } from "react";

type Lang = "html" | "css" | "js";
export const FileBadge = ({
  fileType,
  children,
}: {
  fileType: Lang;
  children?: ReactNode;
}) => {
  return (
    <Box pos={"absolute"} top={0} right={0} zIndex={3}>
      <HStack
        my={1}
        px={2}
        borderRadius={"5px"}
        border={"1px solid grey"}
        bg={"#282A36"}
        w={"fit-content"}
      >
        <FileIcons fileName={`index.${fileType}`} width={20} />
        <Text fontWeight={"bold"} fontSize={"x-small"} casing={"uppercase"}>
          {fileType}
        </Text>
        {children}
      </HStack>
    </Box>
  );
};

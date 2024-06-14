import { Box, Button, HStack, IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";
import { useLayoutStore } from "stores";

function LayoutSwitcher() {
  const layout = useLayoutStore((state) => state.layout);
  const setLayout = useLayoutStore((state) => state.setLayout);

  return (
    <>
      <Box border={"1px solid #9F7AEA"} borderRadius={5} pos={"relative"}>
        <Box
          position={"absolute"}
          top={1}
          left={
            layout === "horizontal"
              ? 1
              : layout === "vertical"
              ? "38px"
              : "73px"
          }
          transition={"left 0.3s ease"}
          right={0}
          bg={"purple.400"}
          borderRadius={5}
          w={8}
          h={8}
        ></Box>
        <HStack zIndex={1} gap={0}>
          <Tooltip hasArrow label="Horizontal Layout">
            <IconButton
              aria-label="change layout"
              onClick={() => {
                setLayout("horizontal");
              }}
              variant={"ghost"}
              icon={<HorizontalLayoutIcon width="1.5rem" />}
            />
          </Tooltip>
          <Tooltip hasArrow label="Vertical Layout">
            <IconButton
              aria-label="change layout"
              onClick={() => {
                setLayout("vertical");
              }}
              variant={"ghost"}
              icon={<VerticalLayoutIcon width="1.5rem" />}
            />
          </Tooltip>
          <Tooltip hasArrow label="File based Layout">
            <IconButton
              aria-label="change layout"
              onClick={() => {
                setLayout("file");
              }}
              variant={"ghost"}
              icon={<FileLayoutIcon width="1.5rem" />}
            />
          </Tooltip>
        </HStack>
      </Box>
    </>
  );
}

const HorizontalLayoutIcon = ({ width }: { width: string }) => {
  return (
    <svg
      style={{ width: "20px", transform: "rotate(90deg)" }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M11 13V21H4C3.44772 21 3 20.5523 3 20V13H11ZM13 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H13V3ZM3 4C3 3.44772 3.44772 3 4 3H11V11H3V4Z"></path>
    </svg>
  );
};
const VerticalLayoutIcon = ({ width }: { width: string }) => {
  return (
    <svg
      style={{ width: "20px" }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M11 13V21H4C3.44772 21 3 20.5523 3 20V13H11ZM13 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H13V3ZM3 4C3 3.44772 3.44772 3 4 3H11V11H3V4Z"></path>
    </svg>
  );
};

const FileLayoutIcon = ({ width }: { width: string }) => {
  return (
    <svg
      style={{ width: "20px" }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H17V3H21ZM15 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H15V21Z"></path>
    </svg>
  );
};
export default LayoutSwitcher;

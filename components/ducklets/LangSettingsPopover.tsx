import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
} from "@chakra-ui/react";
import FileIcons from "../multiplayer/FileIcons";
import { SettingsIcon } from "@chakra-ui/icons";
import { ReactNode } from "react";

type Lang = "html" | "css" | "js";

const headLibs = [
  {
    name: "Tailwind CSS",
    value: '<script src="https://cdn.tailwindcss.com"></script>',
  },
  {
    name: "Bootstrap ",
    value:
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css" crossorigin="anonymous"></link>',
  },
];
export const LangSettingsPopover = ({
  lang,
  children,
}: {
  lang: Lang;
  children?: ReactNode;
}) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Button size={"sm"} w={"full"} h={"20px"} borderRadius={"5px 5px 0 0"}>
          <HStack>
            <FileIcons fileName={`index.${lang}`} width={20} />
            <Text fontWeight={"bold"} textTransform={"uppercase"}>
              {lang}
            </Text>
            <SettingsIcon fontSize={"1rem"} />
          </HStack>
        </Button>
      </PopoverTrigger>
      <Portal>
        {children && (
          <PopoverContent w={"fit-content"} h={"fit-content"}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>
              Edit{" "}
              <Text as={"pre"} textTransform={"uppercase"} display={"inline"}>
                {lang}
              </Text>
            </PopoverHeader>
            <PopoverBody w={"550px"}>
              {children}
              {lang === "html" && (
                <>
                  <Text fontWeight={"bold"}> Examples: </Text>
                  {headLibs.map((lib) => (
                    <Accordion key={lib.name} allowToggle>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">
                              {lib.name}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <Text fontWeight={"bold"} as="pre">
                            {lib.value}
                          </Text>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </>
              )}
            </PopoverBody>
          </PopoverContent>
        )}
      </Portal>
    </Popover>
  );
};

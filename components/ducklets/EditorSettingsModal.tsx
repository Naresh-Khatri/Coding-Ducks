import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slide,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useClipboard,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import useGlobalStore, {
  useDuckletStore,
  useEditorSettingsStore,
} from "../../stores";
import { Dispatch, SetStateAction, useState } from "react";
import FAIcon from "components/FAIcon";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import FileIcons from "components/multiplayer/FileIcons";

import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import CMEditor from "components/editors/CMEditor";
import CMEditorWithCollab from "components/editors/CMEditorWithCollab";

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

const TABS = [
  {
    id: 0,
    name: "editor",
    label: "Editor",
    labelShort: "Editor",
    Icon: <FAIcon icon={faCode} />,
  },
  {
    id: 1,
    name: "html",
    label: "HTML",
    labelShort: "HTML",
    Icon: <FileIcons fileName="index.html" width={20} />,
  },
  {
    id: 2,
    name: "css",
    label: "CSS",
    labelShort: "CSS",
    Icon: <FileIcons fileName="style.css" width={20} />,
    disabled: true,
  },
  {
    id: 3,
    name: "js",
    label: "JavaScript",
    labelShort: "JS",
    Icon: <FileIcons fileName="script.js" width={20} />,
    disabled: true,
  },
];

interface IEditorSettingsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  initTabName?: string;
  guestMode?: boolean;
  htmlHead?: string;
  setHtmlHead?: Dispatch<SetStateAction<string>>;
}
function EditorSettingsModal({
  isOpen,
  onClose,
  onOpen,
  initTabName,
  guestMode,
  htmlHead,
  setHtmlHead,
}: IEditorSettingsModalProps) {
  const fontSize = useEditorSettingsStore((state) => state.fontSize);
  const setFontSize = useEditorSettingsStore((state) => state.setFontSize);
  const vimEnabled = useEditorSettingsStore((state) => state.vimEnabled);
  const setVimEnabled = useEditorSettingsStore((state) => state.setVimEnabled);

  const [showTooltip, setShowTooltip] = useState(false);

  const [isMobile] = useMediaQuery("(max-width: 650px)");
  const [currTabIdx, setCurrTabIdx] = useState(
    initTabName ? TABS.findIndex((t) => t.name === initTabName) : 0
  );
  const handleTabChange = (index: number) => {
    setCurrTabIdx(index);
  };
  const { setValue, onCopy } = useClipboard("");
  const toast = useToast();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <ModalContent minH="600px" maxW={"700px"}>
        <ModalHeader>{TABS[currTabIdx].label} Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs
            // orientation={isMobile ? "horizontal" : "vertical"}
            orientation={"horizontal"}
            colorScheme="purple"
            variant={"unstyled"}
            onChange={handleTabChange}
          >
            <TabList
              bg={"gray.800"}
              style={{ borderRadius: "5px" }}
              h={"100%"}
              // w={"200px"}
            >
              {TABS.map((tab) => (
                <Box key={tab.id} w={"100%"}>
                  <Tab
                    w={"100%"}
                    fontWeight={"bold"}
                    // isDisabled={tab.disabled}
                    justifyContent={"start"}
                    _selected={{ bg: "purple.700", borderRadius: "md" }}
                  >
                    <HStack>
                      {tab.Icon}
                      <Text>{tab.labelShort}</Text>
                    </HStack>
                  </Tab>
                  <Divider />
                </Box>
              ))}
            </TabList>
            <TabPanels>
              <TabPanel>
                <FormControl>
                  <FormLabel fontWeight={"bold"}>Font Size</FormLabel>
                  <Slider
                    id="slider"
                    defaultValue={fontSize}
                    min={12}
                    max={36}
                    colorScheme="purple"
                    onChange={(v) => setFontSize(v)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <SliderMark value={18} mt="2" ml="-2.5" fontSize="sm">
                      18px
                    </SliderMark>
                    <SliderMark value={24} mt="2" ml="-2.5" fontSize="sm">
                      24px
                    </SliderMark>
                    <SliderMark value={30} mt="2" ml="-2.5" fontSize="sm">
                      30px
                    </SliderMark>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <Tooltip
                      hasArrow
                      bg="teal.500"
                      color="white"
                      placement="top"
                      isOpen={showTooltip}
                      label={`${fontSize}px`}
                    >
                      <SliderThumb />
                    </Tooltip>
                  </Slider>
                </FormControl>
                <FormControl display="flex" alignItems="center" mt={"3rem"}>
                  <FormLabel htmlFor="enable-vim" mb="0" fontWeight={"bold"}>
                    VIM bindings?
                  </FormLabel>
                  <Switch
                    id="enable-vim"
                    isChecked={vimEnabled}
                    onChange={(e) => setVimEnabled(e.target.checked)}
                  />
                </FormControl>
              </TabPanel>
              <TabPanel>
                <FormControl>
                  <FormLabel fontWeight={"bold"}>Edit Head</FormLabel>
                  <Box bg={"#282A36"}>
                    <Text as={"code"}>&lt;head&gt;</Text>
                    {guestMode && htmlHead && setHtmlHead && (
                      <CMEditor
                        value={htmlHead}
                        setValue={setHtmlHead}
                        lang={"html"}
                      />
                    )}
                    <CMEditorWithCollab lang={"head"} />
                    <Text as={"code"}>&lt;/head&gt;</Text>
                  </Box>
                </FormControl>
                <Text fontWeight={"bold"}> Examples: </Text>

                {headLibs.map((lib) => (
                  <Accordion key={lib.name} allowToggle>
                    <AccordionItem>
                      <h2>
                        <AccordionButton>
                          <HStack as="span" flex="1" textAlign="left">
                            <Text>{lib.name}</Text>
                          </HStack>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text
                          fontWeight={"bold"}
                          as="code"
                          p={"1"}
                          _hover={{
                            bg: "gray.600",
                            cursor: "clipboard",
                            borderRadius: "3px",
                          }}
                          _active={{ bg: "gray.500" }}
                          onMouseEnter={() => {
                            setValue(lib.value);
                          }}
                          onClick={() => {
                            onCopy();
                            toast({
                              title: "Tag copied!",
                              status: "success",
                              position: "top",
                            });
                          }}
                        >
                          {lib.value}
                        </Text>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                ))}
              </TabPanel>
              <TabPanel>
                <p>coming soon!</p>
              </TabPanel>
              <TabPanel>
                <p>coming soon!</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          {/* <Button mr={3} variant="ghost" onClick={onClose}>
            Close
          </Button> */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EditorSettingsModal;

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
  useDisclosure,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import useGlobalStore, {
  useDuckletStore,
  useEditorSettingsStore,
} from "../../stores";
import { Dispatch, SetStateAction, useState } from "react";
import FAIcon from "_components/FAIcon";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import FileIcons from "_components/multiplayer/FileIcons";

import CMEditor from "_components/editors/CMEditor";
import dynamic from "next/dynamic";
const MonacoEditorWithCollab = dynamic(
  () => import("_components/editors/MonacoEditorWithCollab"),
  {
    ssr: false,
  }
);

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
  const {
    isOpen: isAdvanceModalOpen,
    onOpen: onAdvanceModalOpen,
    onClose: onAdvanceModalClose,
  } = useDisclosure();

  return (
    <>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
          <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
          <ModalContent minH="400px">
            <ModalHeader>
              <Text fontSize={"2rem"}>Editor Settings</Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
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
                    bg="purple.500"
                    color="white"
                    placement="top"
                    isOpen={showTooltip}
                    label={`${fontSize}px`}
                  >
                    <SliderThumb />
                  </Tooltip>
                </Slider>
              </FormControl>
              <FormControl
                display="flex"
                justifyContent={"space-between"}
                alignItems="center"
                mt={"3rem"}
              >
                <FormLabel htmlFor="enable-vim" mb="0" fontWeight={"bold"}>
                  VIM bindings? (only for experts)
                </FormLabel>
                <Switch
                  id="enable-vim"
                  isChecked={vimEnabled}
                  onChange={(e) => setVimEnabled(e.target.checked)}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter justifyContent={"space-between"}>
              <Button onClick={onAdvanceModalOpen} colorScheme="purple">
                Edit Head
              </Button>
              <Button mr={3} variant="ghost" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      {isAdvanceModalOpen && (
        <Modal
          isOpen={isAdvanceModalOpen}
          onClose={onAdvanceModalClose}
          size={"lg"}
        >
          <ModalOverlay />
          <ModalContent minH="600px" minW={"700px"}>
            <ModalHeader>
              <Text fontSize={"2rem"}>Edit Head</Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <Box bg={"#282A36"} height={"150px"} mb={"4rem"}>
                  <Text as={"code"}>&lt;head&gt;</Text>
                  {guestMode && htmlHead && setHtmlHead && (
                    <CMEditor
                      value={htmlHead}
                      setValue={setHtmlHead}
                      lang={"html"}
                    />
                  )}
                  {/* <CMEditorWithCollab lang={"head"} /> */}
                  <MonacoEditorWithCollab lang={"head"} />
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
            </ModalBody>
            <ModalFooter>
              {/* <Button mr={3} variant="ghost" onClick={onClose}>
            Close
          </Button> */}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default EditorSettingsModal;

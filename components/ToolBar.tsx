import {
  Box,
  HStack,
  Select,
  useColorModeValue,
  IconButton,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faClose,
  faDownload,
  faGear,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { Lang, Theme } from "../types";
import { EDITOR_LANGUAGES, EDITOR_THEMES } from "../data/Editor";
import ToolbarSettings from "./modals/ToolbarSettings";
import { EditorSettingsContext } from "../contexts/editorSettingsContext";

interface ToolBarProps {
  isLoading?: boolean;
  runCode?: () => void;
  onCodeRetrievalModalOpen?: () => void;
  onCodeReset?: () => void;
}

export default function ToolBar({
  onCodeRetrievalModalOpen,
  onCodeReset,
}: ToolBarProps) {
  const { settings, updateSettings, setBottomSheetIsOpen } = useContext(
    EditorSettingsContext
  );
  const { theme, lang } = settings;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const color = useColorModeValue("black", "white");

  return (
    <>
      <HStack p={2} w={"full"} justifyContent="space-between">
        <Box>
          <Select
            bg="purple.500"
            color="white"
            maxW={40}
            value={lang}
            onChange={(e) => {
              updateSettings({ lang: e.target.value as Lang });
            }}
            fontWeight="extrabold"
          >
            {EDITOR_LANGUAGES.map((lang) => (
              <option key={lang.value} style={{ color }} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </Select>
        </Box>
        <HStack>
          {onCodeReset && (
            <Tooltip label="Reset code to initial state">
              <IconButton
                aria-label="Reset code to initial state"
                icon={<FontAwesomeIcon icon={faRefresh as IconProp} />}
                onClick={onCodeReset}
              />
            </Tooltip>
          )}
          {onCodeRetrievalModalOpen && (
            <Tooltip label="Retrieve last submitted code">
              <IconButton
                aria-label="retrieve last submitted code"
                icon={<FontAwesomeIcon icon={faDownload as IconProp} />}
                onClick={onCodeRetrievalModalOpen}
              />
            </Tooltip>
          )}
          <Select
            maxW={40}
            onChange={(e) => {
              updateSettings({ theme: e.target.value as Theme });
            }}
            bg="purple.500"
            value={theme}
            color="white"
            fontWeight={"extrabold"}
            display={{ base: "none", md: "block" }}
          >
            {EDITOR_THEMES.map((theme) => (
              <option key={theme.value} style={{ color }} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </Select>

          <Tooltip label="Customize your editor">
            <IconButton
              aria-label="customize your editor"
              icon={<FontAwesomeIcon icon={faGear as IconProp} />}
              onClick={onOpen}
            />
          </Tooltip>
          <IconButton
            display={{ base: "flex", md: "none" }}
            aria-label="close"
            colorScheme="red"
            icon={<FontAwesomeIcon icon={faClose as IconProp} />}
            onClick={() => setBottomSheetIsOpen(false)}
          />
        </HStack>
      </HStack>
      <ToolbarSettings isOpen={isOpen} onClose={onClose} />
    </>
  );
}

import {
  Box,
  HStack,
  Select,
  useColorModeValue,
  IconButton,
  Tooltip,
  useDisclosure,
  Button,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  faClose,
  faDownload,
  faGear,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import { Lang, Theme } from "../types";
import { EDITOR_LANGUAGES, EDITOR_THEMES } from "../data/Editor";
import ToolbarSettings from "./modals/ToolbarSettings";
import { EditorSettingsContext } from "../contexts/editorSettingsContext";
import FAIcon from "./FAIcon";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";

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

  const router = useRouter();
  const isPlayground = router.pathname === "/playground";

  const [isMobile] = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <HStack py={2} w={"full"} justifyContent="space-between">
        <Box>
          {!isMobile && isPlayground ? (
            <ToggleButtons lang={lang} langs={EDITOR_LANGUAGES} />
          ) : (
            <Select
              color="white"
              maxW={40}
              value={lang}
              onChange={(e) => {
                if (!isPlayground)
                  updateSettings({ lang: e.target.value as Lang });
                else router.push(`?lang=${e.target.value}`);
              }}
              fontWeight="extrabold"
            >
              {EDITOR_LANGUAGES.map((lang) => (
                <option key={lang.value} style={{ color }} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </Select>
          )}
        </Box>
        <HStack>
          {onCodeReset && (
            <Tooltip label="Reset code to initial state">
              <IconButton
                aria-label="Reset code to initial state"
                icon={<FAIcon icon={faRefresh} />}
                onClick={onCodeReset}
              />
            </Tooltip>
          )}
          {onCodeRetrievalModalOpen && (
            <Tooltip label="Retrieve last submitted code">
              <IconButton
                aria-label="retrieve last submitted code"
                icon={<FAIcon icon={faDownload} />}
                onClick={onCodeRetrievalModalOpen}
              />
            </Tooltip>
          )}
          <Select
            maxW={40}
            onChange={(e) => {
              updateSettings({ ...settings, theme: e.target.value as Theme });
            }}
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
              icon={<FAIcon icon={faGear} />}
              onClick={onOpen}
            />
          </Tooltip>
          <IconButton
            display={{ base: "flex", md: "none" }}
            aria-label="close"
            colorScheme="red"
            icon={<FAIcon icon={faClose} />}
            onClick={() => setBottomSheetIsOpen(false)}
          />
        </HStack>
      </HStack>
      <ToolbarSettings isOpen={isOpen} onClose={onClose} />
    </>
  );
}

const ToggleButtons = ({
  lang,
  langs,
}: {
  lang: Lang;
  langs: { label: string; value: string; iconPath: string }[];
}) => {
  const router = useRouter();
  const { lang: queryLang } = router.query as { lang: Lang };
  const tabIndicatorStyles = {
    py: { left: 10, width: 100 },
    js: { left: 120, width: 120 },
    cpp: { left: 250, width: 80 },
    java: { left: 340, width: 80 },
  };
  return (
    <HStack
      pos={"relative"}
      bg={"dark"}
      px={2}
      border={"1px solid #333"}
      borderRadius={"8px"}
    >
      {langs.map((lang) => (
        <Tooltip label={lang.label} key={lang.value}>
          <Link href={"?lang=" + lang.value}>
            <Button aria-label={lang.label} bg={"dark"} _hover={{ bg: "none" }}>
              <HStack zIndex={2}>
                <Image
                  src={lang.iconPath}
                  alt={lang.label}
                  width={20}
                  height={20}
                />
                <Text>{lang.label}</Text>
              </HStack>
            </Button>
          </Link>
        </Tooltip>
      ))}
      <Box
        pos={"absolute"}
        transition={"all 0.1s ease-out"}
        left={tabIndicatorStyles[queryLang || "py"].left + "px"}
        top={1}
        w={tabIndicatorStyles[queryLang || "py"].width + "px"}
        h={"calc(100% - 8px)"}
        borderRadius={"8px"}
        bg={"purple.700"}
      ></Box>
    </HStack>
  );
};

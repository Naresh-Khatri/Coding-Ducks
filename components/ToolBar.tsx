import {
  Box,
  HStack,
  Select,
  useColorModeValue,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCode, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Lang, Theme } from "../types";

interface ToolBarProps {
  isLoading?: boolean;
  runCode?: () => void;
  lang?: string;
  setLang: (lang: Lang) => void;
  theme?: string;
  setTheme: (theme: Theme) => void;
  onCodeRetrievalModalOpen?: () => void;
  onCodeReset?: () => void;
}

export default function ToolBar({
  lang,
  setLang,
  setTheme,
  onCodeRetrievalModalOpen,
  onCodeReset,
}: ToolBarProps) {
  const color = useColorModeValue("black", "white");
  const changeLang = (lang: Lang) => {
    setLang(lang);
    localStorage.setItem("lang", lang);
  };
  useEffect(() => {
    const lang = localStorage.getItem("lang") as Lang;
    if (lang) {
      setLang(lang);
    }
  }, []);

  return (
    <HStack p={2} w={"full"} justifyContent="space-between">
      <Box>
        <Select
          bg="purple.500"
          color="white"
          maxW={40}
          value={lang}
          onChange={(e) => {
            changeLang(e.target.value as Lang);
          }}
          fontWeight="extrabold"
        >
          <option style={{ color: color }} value="py">
            Python
          </option>
          <option style={{ color }} value="js">
            Javascript
          </option>
          <option style={{ color }} value="cpp">
            C++
          </option>
          {/* <option style={{ color }} value='c'>
            C
          </option> */}
          <option style={{ color }} value="java">
            Java
          </option>
        </Select>
      </Box>
      <HStack>
        {onCodeReset && (
          <Tooltip label="Reset code to initial state">
            <IconButton
              aria-label="Reset code to initial state"
              icon={<FontAwesomeIcon icon={faDeleteLeft as IconProp} />}
              onClick={onCodeReset}
            />
          </Tooltip>
        )}
        {onCodeRetrievalModalOpen && (
          <Tooltip label="Retrieve last submitted code">
            <IconButton
              aria-label="retrieve last submitted code"
              icon={<FontAwesomeIcon icon={faCode as IconProp} />}
              onClick={onCodeRetrievalModalOpen}
            />
          </Tooltip>
        )}
        <Select
          maxW={40}
          onChange={(e) => {
            setTheme(e.target.value as Theme);
            localStorage.setItem("theme", e.target.value);
          }}
          bg="purple.500"
          color="white"
          fontWeight={"extrabold"}
        >
          <option style={{ color }} value="dracula">
            Dracula
          </option>
          <option style={{ color }} value="monokai">
            Monokai
          </option>
          <option style={{ color }} value="github">
            Github
          </option>
          <option style={{ color }} value="tomorrow">
            Tomorrow
          </option>
          <option style={{ color }} value="kuroir">
            Kuroir
          </option>
          <option style={{ color }} value="twilight">
            Twilight
          </option>
          <option style={{ color }} value="xcode">
            xcode
          </option>
          <option style={{ color }} value="textmate">
            TextMate
          </option>
          <option style={{ color }} value="solarized dark">
            Solarized Dark
          </option>
          <option style={{ color }} value="solarized light">
            Solarized Light
          </option>
          <option style={{ color }} value="terminal">
            Terminal
          </option>
        </Select>
      </HStack>
    </HStack>
  );
}

import { AddIcon } from "@chakra-ui/icons";
import {
  Button,
  Box,
  HStack,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";

export default function ToolBar({
  isLoading,
  runCode,
  lang,
  setLang,
  theme,
  setTheme,
  saveBtnLoading,
}) {
  const color = useColorModeValue("black", "white");
  return (
    <Box>
      <HStack p={2} justifyContent="end">
        <Select
          bg="purple.500"
          color="white"
          maxW={40}
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            localStorage.setItem("lang", e.target.value);
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
          <option style={{ color }} value="c">
            C
          </option>
          <option style={{ color }} value="java">
            Java
          </option>
        </Select>
        <Select
          maxW={40}
          onChange={(e) => {
            setTheme(e.target.value);
            localStorage.setItem("theme", e.target.value);
          }}
          bg="purple.500"
          color="white"
          fontWeight={"extrabold"}
        >
          <option style={{ color }} value="dracula">
            Dracula
          </option>
          <option style={{ color }} value="atomone">
            Atom One
          </option>
          <option style={{ color }} value="eclipse">
            Eclipse
          </option>
          <option style={{ color }} value="okaidia">
            Okaidia
          </option>
          <option style={{ color }} value="githubDark">
            Github Dark
          </option>
          <option style={{ color }} value="githubLight">
            Github Light
          </option>
          <option style={{ color }} value="duotoneDark">
            Duotone Dark
          </option>
          <option style={{ color }} value="duotoneLight">
            Duotone Light
          </option>
          <option style={{ color }} value="xcodeDark">
            Xcode Dark
          </option>
          <option style={{ color }} value="xcodeLight">
            Xcode Light
          </option>
        </Select>
      </HStack>
    </Box>
  );
}

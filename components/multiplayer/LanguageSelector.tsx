import { Button, Select, useColorModeValue } from "@chakra-ui/react";
import React from "react";

interface LanguageSelectorProps {
  roomInfo: any;
  handleLangChange: (e) => void;
}
function LanguageSelector({
  roomInfo,
  handleLangChange,
}: LanguageSelectorProps) {
  // for select option bg
  const color = useColorModeValue("black", "white");
  return (
    <Select
      bg="purple.500"
      color="white"
      maxW={40}
      value={roomInfo?.lang || "py"}
      onChange={handleLangChange}
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
  );
}

export default LanguageSelector;

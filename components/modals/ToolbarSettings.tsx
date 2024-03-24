import {
  Box,
  Flex,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useContext } from "react";
import { EditorSettingsContext } from "../../contexts/editorSettingsContext";
import { IKeyBinds } from "../../types";

interface ToolbarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}
function ToolbarSettings({ isOpen, onClose }: ToolbarSettingsProps) {
  const { settings, updateSettings } = useContext(EditorSettingsContext);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editor Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack>
            <Flex justifyContent={"space-between"} alignItems={"center"}>
              <Text> Font size </Text>
              <Select
                w={"120px"}
                value={settings.fontSize}
                onChange={(e) =>
                  updateSettings({ ...settings, fontSize: +e.target.value })
                }
              >
                {[10, 12, 14, 16, 18, 20, 22, 24].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </Flex>
            <Flex justifyContent={"space-between"} alignItems={"center"}>
              <Text> Tab size </Text>
              <Select
                w={"120px"}
                value={settings.tabSize}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    tabSize: +e.target.value as 2 | 4,
                  })
                }
              >
                {[2, 4].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </Flex>
            <Flex justifyContent={"space-between"} alignItems={"center"}>
              <Text> Key bindings </Text>
              <Select
                w="120px"
                value={settings.keyBindings}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    keyBindings: e.target.value as IKeyBinds,
                  })
                }
              >
                <option value="default">Default</option>
                <option value="vim">Vim</option>
                <option value="emacs">Emacs</option>
                <option value="sublime">Sublime</option>
                <option value="vscode">VS Code</option>
              </Select>
            </Flex>
            <Flex
              justifyContent={"space-between"}
              alignItems={"center"}
              h={"40px"}
            >
              <Box>
                <Kbd>ctrl</Kbd> + <Kbd>enter</Kbd> runs code
              </Box>
              <Switch
                isDisabled
                isChecked={settings.runCodeOnCtrlEnter}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    runCodeOnCtrlEnter: e.target.checked,
                  })
                }
              />
            </Flex>
            <Flex
              justifyContent={"space-between"}
              alignItems={"center"}
              h={"40px"}
            >
              <Text> Show driver code </Text>
              <Switch
                isDisabled
                isChecked={settings.showDriverCode}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    showDriverCode: e.target.checked,
                  })
                }
              />
            </Flex>
          </Stack>
          {/* font size key bindings tabSize ctrl enter theme show driver Code */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ToolbarSettings;

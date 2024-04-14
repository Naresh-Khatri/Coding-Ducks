import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { faCubes } from "@fortawesome/free-solid-svg-icons";
import CMEditorWithCollab from "components/editors/CMEditorWithCollab";
import FAIcon from "components/FAIcon";
import FileIcons from "components/multiplayer/FileIcons";
import Split from "react-split";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { LangSettingsPopover } from "./LangSettingsPopover";
import CMEditor from "components/editors/CMEditor";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { SettingsIcon } from "@chakra-ui/icons";
import { useDuckletStore } from "stores";
import EditorSettingsModal from "./EditorSettingsModal";
export const MobileView = ({
  guestMode,
  guestState,
  srcDoc,
}: {
  guestMode?: boolean;
  guestState?: {
    head: string;
    html: string;
    css: string;
    js: string;
    setHead: Dispatch<SetStateAction<string>>;
    setHtml: Dispatch<SetStateAction<string>>;
    setCss: Dispatch<SetStateAction<string>>;
    setJs: Dispatch<SetStateAction<string>>;
  };
  srcDoc?: string;
}) => {
  const yDoc = useDuckletStore((state) => state.yDoc);
  const yjsReady = useDuckletStore((state) => state.yjsReady);
  const _srcDoc = useDuckletStore((state) => state.srcDoc);
  const provider = useDuckletStore((state) => state.provider);
  const {
    isOpen: isEditorSettingsModalOpen,
    onOpen: onEditorSettingsModalOpen,
    onClose: onEditorSettingsModalClose,
  } = useDisclosure();
  return (
    <>
      <Split
        style={{ height: "calc(100dvh - 48px - 28px - 7px)", width: "100%" }}
        className={"split-v"}
        direction={"vertical"}
        minSize={200}
        sizes={[40, 60]}
      >
        <Box h={"100%"} pos={"relative"}>
          <Tabs position="relative" variant={"enclosed"} h={"100%"}>
            <TabList>
              <Tab>
                <FileIcons fileName="index.html" width={20} />{" "}
                <Text fontWeight={"bold"}>HTML</Text>
              </Tab>
              <Tab>
                <FileIcons fileName="style.css" width={20} />{" "}
                <Text fontWeight={"bold"}>CSS</Text>
              </Tab>
              <Tab>
                <FileIcons fileName="script.js" width={20} />{" "}
                <Text fontWeight={"bold"}>JS</Text>
              </Tab>
            </TabList>
            <TabIndicator
              mt="-1.5px"
              height="2px"
              bg="blue.500"
              borderRadius="1px"
            />
            <TabPanels h={"calc(100% - 39px)"}>
              <TabPanel p={0} h={"100%"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState?.html}
                    setValue={guestState?.setHtml}
                    lang={"html"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"html"}
                  />
                )}
              </TabPanel>
              <TabPanel p={0} h={"100%"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState?.css}
                    setValue={guestState?.setCss}
                    lang={"css"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"css"}
                  />
                )}
              </TabPanel>
              <TabPanel p={0} h={"100%"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState.js}
                    setValue={guestState.setJs}
                    lang={"js"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"js"}
                  />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        <Box w={"full"} h={"full"} bg={"white"}>
          <iframe
            title="output"
            sandbox="allow-scripts"
            width={"100%"}
            height={"100%"}
            srcDoc={guestMode ? srcDoc : _srcDoc}
          ></iframe>
        </Box>
      </Split>

      {isEditorSettingsModalOpen && (
        <EditorSettingsModal
          isOpen={isEditorSettingsModalOpen}
          onClose={onEditorSettingsModalClose}
          onOpen={onEditorSettingsModalOpen}
        />
      )}
    </>
  );
};
export const DesktopView = ({
  guestMode,
  srcDoc,
  guestState,
}: {
  guestMode?: boolean;
  srcDoc?: string;
  guestState?: {
    head: string;
    html: string;
    css: string;
    js: string;
    setHead: Dispatch<SetStateAction<string>>;
    setHtml: Dispatch<SetStateAction<string>>;
    setCss: Dispatch<SetStateAction<string>>;
    setJs: Dispatch<SetStateAction<string>>;
  };
}) => {
  const layout = useDuckletStore((state) => state.layout);
  const yDoc = useDuckletStore((state) => state.yDoc);
  const yjsReady = useDuckletStore((state) => state.yjsReady);
  const _srcDoc = useDuckletStore((state) => state.srcDoc);
  const provider = useDuckletStore((state) => state.provider);

  const {
    isOpen: isEditorSettingsModalOpen,
    onOpen: onEditorSettingsModalOpen,
    onClose: onEditorSettingsModalClose,
  } = useDisclosure();
  const [initTabName, setInitTabName] = useState<
    "editor" | "html" | "css" | "js"
  >("editor");
  return (
    <>
      <Split
        key={layout}
        style={{ height: "calc(100dvh - 48px - 28px - 7px)", width: "100%" }}
        className={layout === "horizontal" ? "split-h" : "split-v"}
        direction={layout === "horizontal" ? "horizontal" : "vertical"}
        minSize={200}
        sizes={[40, 60]}
      >
        <Box h={"100%"}>
          <Split
            className={layout !== "horizontal" ? "split-h" : "split-v"}
            direction={layout !== "horizontal" ? "horizontal" : "vertical"}
            minSize={20}
            snapOffset={50}
            style={{
              width: "100%",
              height: "100%",
              background: "#282A36 !important",
            }}
          >
            <Flex direction={"column"}>
              <Button
                size={"sm"}
                w={"full"}
                h={"20px"}
                borderRadius={"5px 5px 0 0"}
                onClick={() => {
                  // setInitTabName("html");
                  onEditorSettingsModalOpen();
                }}
              >
                <HStack>
                  <FileIcons fileName={`index.html`} width={20} />
                  <Text fontWeight={"bold"} textTransform={"uppercase"}>
                    HTML
                  </Text>
                </HStack>
              </Button>
              <Flex flex={1} height={"calc(100% - 30px)"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState.html}
                    setValue={guestState.setHtml}
                    lang={"html"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"html"}
                  />
                )}
              </Flex>
            </Flex>
            <Flex direction={"column"}>
              <Button
                size={"sm"}
                w={"full"}
                h={"20px"}
                borderRadius={"5px 5px 0 0"}
                onClick={() => {
                  // setInitTabName("css");
                  onEditorSettingsModalOpen();
                }}
              >
                <HStack>
                  <FileIcons fileName={`style.css`} width={20} />
                  <Text fontWeight={"bold"} textTransform={"uppercase"}>
                    CSS
                  </Text>
                </HStack>
              </Button>
              <Flex flex={1} height={"calc(100% - 30px)"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState.css}
                    setValue={guestState.setCss}
                    lang={"css"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"css"}
                  />
                )}
              </Flex>
            </Flex>
            <Flex direction={"column"}>
              <Button
                size={"sm"}
                w={"full"}
                h={"20px"}
                borderRadius={"5px 5px 0 0"}
                onClick={() => {
                  // setInitTabName("css");
                  onEditorSettingsModalOpen();
                }}
              >
                <HStack>
                  <FileIcons fileName={`script.js`} width={20} />
                  <Text fontWeight={"bold"} textTransform={"uppercase"}>
                    JS
                  </Text>
                </HStack>
              </Button>
              <Flex flex={1} height={"calc(100% - 20px)"}>
                {guestMode && guestState && (
                  <CMEditor
                    value={guestState.js}
                    setValue={guestState.setJs}
                    lang={"js"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    loading={!yjsReady}
                    yDoc={yDoc}
                    provider={provider}
                    lang={"js"}
                  />
                )}
              </Flex>
            </Flex>
          </Split>
        </Box>
        <Box w={"full"} h={"full"} bg={"white"}>
          <iframe
            title="output"
            sandbox="allow-scripts"
            width={"100%"}
            height={"100%"}
            srcDoc={guestMode ? srcDoc : _srcDoc}
          ></iframe>
        </Box>
      </Split>

      {isEditorSettingsModalOpen && (
        <EditorSettingsModal
          isOpen={isEditorSettingsModalOpen}
          onClose={onEditorSettingsModalClose}
          onOpen={onEditorSettingsModalOpen}
          initTabName={initTabName}
          guestMode={guestMode}
          htmlHead={guestState?.head}
          setHtmlHead={guestState?.setHead}
        />
      )}
    </>
  );
};

import {
  Box,
  Button,
  Flex,
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
export const MobileView = ({
  provider,
  yDoc,
  isGuest,
  guestState,
  srcDoc,
}: {
  yDoc?: Y.Doc;
  provider?: WebsocketProvider;
  isGuest?: boolean;
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
  srcDoc: string;
}) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  // const srcDoc = useMemo(() => {
  //   return `
  //   <html>
  //     <head>${contentHEAD}</head>
  //     <body>${contentHTML}</body>
  //     <style>${contentCSS}</style>
  //     <script>${contentJS}</script>
  //   </html>
  // `;
  // }, [contentHEAD, contentHTML, contentCSS, contentJS]);

  return (
    <Split
      style={{ height: "calc(100dvh - 48px)", width: "100%" }}
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
              {isGuest && guestState && (
                <CMEditor
                  value={guestState?.html}
                  setValue={guestState?.setHtml}
                  lang={"html"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
                  yDoc={yDoc}
                  provider={provider}
                  lang={"html"}
                />
              )}
            </TabPanel>
            <TabPanel p={0} h={"100%"}>
              {isGuest && guestState && (
                <CMEditor
                  value={guestState?.css}
                  setValue={guestState?.setCss}
                  lang={"css"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
                  yDoc={yDoc}
                  provider={provider}
                  lang={"css"}
                />
              )}
            </TabPanel>
            <TabPanel p={0} h={"100%"}>
              {isGuest && guestState && (
                <CMEditor
                  value={guestState.js}
                  setValue={guestState.setJs}
                  lang={"js"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
                  yDoc={yDoc}
                  provider={provider}
                  lang={"js"}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
        <Button
          onClick={onOpen}
          position={"absolute"}
          top={0}
          right={0}
          variant={"ghost"}
        >
          <FAIcon icon={faCubes} />
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add head contents</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Box bg={"#282A36"}>
                  <Text as={"code"}>&lt;head&gt;</Text>
                  {isGuest && guestState && (
                    <CMEditor
                      value={guestState?.head}
                      setValue={guestState.setHead}
                      lang={"html"}
                    />
                  )}
                  {yDoc && provider && (
                    <CMEditorWithCollab
                      yDoc={yDoc}
                      provider={provider}
                      lang={"head"}
                    />
                  )}
                  <Text as={"code"}>&lt;/head&gt;</Text>
                </Box>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </ModalContent>
          </Modal>
        </Button>
      </Box>
      <Box w={"full"} h={"full"} bg={"white"}>
        <iframe
          title="output"
          sandbox="allow-scripts"
          width={"100%"}
          height={"100%"}
          srcDoc={srcDoc}
        ></iframe>
      </Box>
    </Split>
  );
};
export const DesktopView = ({
  layout,
  provider,
  yDoc,
  srcDoc,
  isGuest,
  guestState,
}: {
  layout: "vertical" | "horizontal";
  yDoc?: Y.Doc;
  provider?: WebsocketProvider;
  srcDoc: string;
  isGuest?: boolean;
  guestState?: {
    head: string;
    html: string;
    css: string;
    js: string;
    setHead: Dispatch<React.SetStateAction<string>>;
    setHtml: Dispatch<React.SetStateAction<string>>;
    setCss: Dispatch<React.SetStateAction<string>>;
    setJs: Dispatch<React.SetStateAction<string>>;
  };
}) => {
  return (
    <Split
      key={layout}
      style={{ height: "calc(100dvh - 48px)", width: "100%" }}
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
            <LangSettingsPopover lang="html">
              <Box bg={"#282A36"}>
                <Text as={"code"}>&lt;head&gt;</Text>
                {isGuest && guestState && (
                  <CMEditor
                    value={guestState.head}
                    setValue={guestState.setHead}
                    lang={"html"}
                  />
                )}
                {yDoc && provider && (
                  <CMEditorWithCollab
                    yDoc={yDoc}
                    provider={provider}
                    lang={"head"}
                  />
                )}
                <Text as={"code"}>&lt;/head&gt;</Text>
              </Box>
            </LangSettingsPopover>
            <Flex flex={1} height={"calc(100% - 30px)"}>
              {isGuest && guestState && (
                <CMEditor
                  value={guestState.html}
                  setValue={guestState.setHtml}
                  lang={"html"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
                  yDoc={yDoc}
                  provider={provider}
                  lang={"html"}
                />
              )}
            </Flex>
          </Flex>
          <Flex direction={"column"}>
            <LangSettingsPopover lang="css"></LangSettingsPopover>
            <Flex flex={1} height={"calc(100% - 30px)"}>
              {isGuest && guestState && (
                <CMEditor
                  value={guestState.css}
                  setValue={guestState.setCss}
                  lang={"css"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
                  yDoc={yDoc}
                  provider={provider}
                  lang={"css"}
                />
              )}
            </Flex>
          </Flex>
          <Flex direction={"column"}>
            <LangSettingsPopover lang="js"></LangSettingsPopover>
            <Flex flex={1} height={"calc(100% - 20px)"}>
              {isGuest && guestState && (
                <CMEditor
                  value={guestState.js}
                  setValue={guestState.setJs}
                  lang={"js"}
                />
              )}
              {yDoc && provider && (
                <CMEditorWithCollab
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
          srcDoc={srcDoc}
        ></iframe>
      </Box>
    </Split>
  );
};

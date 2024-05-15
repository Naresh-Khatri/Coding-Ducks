import {
  Box,
  Button,
  Flex,
  HStack,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import CMEditorWithCollab from "components/editors/CMEditorWithCollab";
import FileIcons from "components/multiplayer/FileIcons";
import Split from "react-split";
import CMEditor from "components/editors/CMEditor";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useDuckletStore } from "stores";
import EditorSettingsModal from "./EditorSettingsModal";
// import MonacoEditorWithCollab from "components/editors/MonacoEditorWithCollab";
import dynamic from "next/dynamic";

const MonacoEditorWithCollab = dynamic(
  () => import("components/editors/MonacoEditorWithCollab"),
  {
    ssr: false,
  }
);

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
  const provider = useDuckletStore((state) => state.provider);
  const yjsConnected = useDuckletStore((state) => state.yjsConnected);

  const _srcDoc = useDuckletStore((state) => state.srcDoc);

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
                {guestMode ? (
                  guestState && (
                    <CMEditor
                      value={guestState?.html}
                      setValue={guestState?.setHtml}
                      lang={"html"}
                    />
                  )
                ) : (
                  // <CMEditorWithCollab lang={"html"} />
                  <MonacoEditorWithCollab lang={"html"} />
                )}
              </TabPanel>
              <TabPanel p={0} h={"100%"}>
                {guestMode ? (
                  guestState && (
                    <CMEditor
                      value={guestState?.css}
                      setValue={guestState?.setCss}
                      lang={"css"}
                    />
                  )
                ) : (
                  // <CMEditorWithCollab lang={"css"} />
                  <MonacoEditorWithCollab lang={"css"} />
                )}
              </TabPanel>
              <TabPanel p={0} h={"100%"}>
                {guestMode ? (
                  guestState && (
                    <CMEditor
                      value={guestState.js}
                      setValue={guestState.setJs}
                      lang={"js"}
                    />
                  )
                ) : (
                  // <CMEditorWithCollab lang={"js"} />
                  <MonacoEditorWithCollab lang={"js"} />
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
  const _srcDoc = useDuckletStore((state) => state.srcDoc);
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
        // SINCE LAYOUT != SPLIT TYPE
        className={
          layout === "vertical" || layout === "file" ? "split-h" : "split-v"
        }
        direction={
          layout === "vertical" || layout === "file" ? "horizontal" : "vertical"
        }
        minSize={200}
        sizes={[40, 60]}
      >
        {layout === "file" ? (
          <Box h={"100%"} position={"relative"}>
            <Tabs
              variant="enclosed"
              h={"100%"}
              w={"100%"}
              position={"absolute"}
              // top={"-10px"}
              // bg={}
            >
              <TabList>
                <Tab
                  _selected={{
                    color: "purple.400",
                    fontWeight: "bold",
                    border: "1px solid #9F7AEA",
                  }}
                >
                  <HStack>
                    <FileIcons fileName={`index.html`} width={20} />
                    <Text>HTML</Text>
                  </HStack>
                </Tab>
                <Tab
                  _selected={{
                    color: "purple.400",
                    fontWeight: "bold",
                    border: "1px solid #9F7AEA",
                  }}
                >
                  <HStack>
                    <FileIcons fileName={`style.css`} width={20} />
                    <Text>CSS</Text>
                  </HStack>
                </Tab>
                <Tab
                  _selected={{
                    color: "purple.400",
                    fontWeight: "bold",
                    border: "1px solid #9F7AEA",
                  }}
                >
                  <HStack>
                    <FileIcons fileName={`script.js`} width={20} />
                    <Text>JS</Text>
                  </HStack>
                </Tab>
              </TabList>
              <TabPanels h={"100%"}>
                <TabPanel height={"100%"} p={0}>
                  <Flex flex={1} height={"100%"}>
                    {guestMode ? (
                      guestState && (
                        <CMEditor
                          value={guestState.html}
                          setValue={guestState.setHtml}
                          lang={"html"}
                        />
                      )
                    ) : (
                      <MonacoEditorWithCollab lang={"html"} />
                    )}
                  </Flex>
                </TabPanel>
                <TabPanel height={"100%"} p={0}>
                  <Flex flex={1} height={"calc(100% - 30px)"}>
                    {guestMode ? (
                      guestState && (
                        <CMEditor
                          value={guestState.css}
                          setValue={guestState.setCss}
                          lang={"css"}
                        />
                      )
                    ) : (
                      <MonacoEditorWithCollab lang={"css"} />
                    )}
                  </Flex>
                </TabPanel>
                <TabPanel height={"100%"} p={0}>
                  <Flex flex={1} height={"calc(100% - 20px)"}>
                    {guestMode ? (
                      guestState && (
                        <CMEditor
                          value={guestState.js}
                          setValue={guestState.setJs}
                          lang={"js"}
                        />
                      )
                    ) : (
                      <MonacoEditorWithCollab lang={"js"} />
                    )}
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : (
          <Box h={"100%"}>
            <Split
              className={layout === "horizontal" ? "split-h" : "split-v"}
              direction={layout === "horizontal" ? "horizontal" : "vertical"}
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
                  {guestMode ? (
                    guestState && (
                      <CMEditor
                        value={guestState.html}
                        setValue={guestState.setHtml}
                        lang={"html"}
                      />
                    )
                  ) : (
                    // <CMEditorWithCollab lang={"html"} />
                    <MonacoEditorWithCollab lang={"html"} />
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
                  {guestMode ? (
                    guestState && (
                      <CMEditor
                        value={guestState.css}
                        setValue={guestState.setCss}
                        lang={"css"}
                      />
                    )
                  ) : (
                    // <CMEditorWithCollab lang={"css"} />
                    <MonacoEditorWithCollab lang={"css"} />
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
                  {guestMode ? (
                    guestState && (
                      <CMEditor
                        value={guestState.js}
                        setValue={guestState.setJs}
                        lang={"js"}
                      />
                    )
                  ) : (
                    // <CMEditorWithCollab lang={"js"} />
                    <MonacoEditorWithCollab lang={"js"} />
                  )}
                </Flex>
              </Flex>
            </Split>
          </Box>
        )}
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

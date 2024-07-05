import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import React, { useEffect, useState } from "react";
import { dracula } from "@uiw/codemirror-theme-dracula";
import Split from "react-split";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

function EditorsWithPreview({
  content,
  setContent,
  height,
}: {
  content: { head: string; html: string; css: string; js: string };
  setContent: ({
    head,
    html,
    css,
    js,
  }: {
    head: string;
    html: string;
    css: string;
    js: string;
  }) => void;
  height: string;
}) {
  const [srcDoc, setSrcDoc] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSrcDoc(`<html>
  <head>
  ${content.head}
    <style>
      ${content.css}
    </style>
  </head>
  <body>
    ${content.html}
    <script>
      ${content.js}
    </script>
  </body>
</html>`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);
  return (
    <Split
      className={"split-h"}
      direction={"horizontal"}
      minSize={100}
      snapOffset={50}
      style={{
        width: "100%",
        height: "100%",
        background: "#282A36 !important",
      }}
    >
      <Tabs height={"100%"}>
        <TabList>
          <Tab>HTML</Tab>
          <Tab>CSS</Tab>
          <Tab>JS</Tab>
          <Tab>HEAD</Tab>
        </TabList>

        <TabPanels minH={height}>
          <TabPanel p={0} h={height}>
            <ReactCodeMirror
              theme={dracula}
              height="100%"
              value={content.html}
              onChange={(v) => setContent({ ...content, html: v })}
              extensions={[html()]}
            />
          </TabPanel>
          <TabPanel p={0} h={height}>
            <ReactCodeMirror
              theme={dracula}
              height="100%"
              value={content.css}
              onChange={(v) => setContent({ ...content, css: v })}
              extensions={[css()]}
            />
          </TabPanel>
          <TabPanel p={0} h={height}>
            <ReactCodeMirror
              theme={dracula}
              height="100%"
              value={content.js}
              onChange={(v) => setContent({ ...content, js: v })}
              extensions={[javascript()]}
            />
          </TabPanel>
          <TabPanel p={0} h={height}>
            <ReactCodeMirror
              theme={dracula}
              height="100%"
              value={content.head}
              onChange={(v) => setContent({ ...content, head: v })}
              extensions={[html()]}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Flex>
        <iframe
          title="output"
          sandbox="allow-scripts"
          width={"100%"}
          height={"100%"}
          srcDoc={srcDoc}
        ></iframe>
      </Flex>
    </Split>
  );
}

export default EditorsWithPreview;

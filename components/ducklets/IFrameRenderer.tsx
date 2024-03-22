import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Split from "react-split";

function IFrameRenderer({
  contentHTML,
  contentCSS,
  contentJS,
}: {
  contentHTML: string;
  contentCSS: string;
  contentJS: string;
}) {
  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSrcDoc(
        `<html>
        <body>${contentHTML}</body>
        <style>window.onmessage = function(event){
    if (event.data == 'reply') {
        console('Reply received!');
    }
};</style>
        <style>${contentCSS}</style>
        <script>${contentJS}</script>
        </html>`
      );
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [contentHTML, contentCSS, contentJS]);

  useEffect(() => {
    if (!iFrameRef.current) return;
    return () => {
    };
  }, [iFrameRef.current]);
  // console.log(iFrameRef.current?.contentWindow)
  // console.log(logs)
  return (
    <Box h={"100%"}>
        <iframe
          ref={iFrameRef}
          title="output"
          sandbox="allow-scripts"
          width={"100%"}
          height={"100%"}
          srcDoc={srcDoc}
        ></iframe>
      {/* <Split
        className="split-h"
        direction="horizontal"
        minSize={0}
        sizes={[100, 0]}
        snapOffset={50}
        style={{ width: "100%", height: "100%" }}
      >
        <Box bg={"#1d1d1d"} overflow={'auto'}>
          <pre>{JSON.stringify(logs, null, 2)}</pre>
        </Box>
      </Split> */}
    </Box>
  );
}

export default IFrameRenderer;

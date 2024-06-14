"use client";
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLayoutStore } from "stores";

type TView = "code" | "target" | "diff";
interface IContent {
  head?: string;
  html?: string;
  css?: string;
  js?: string;
}

interface ICodePreviewProps {
  target: IContent;
  source: IContent;
}
function CodePreview({ source, target }: ICodePreviewProps) {
  const [view, setView] = useState<TView>("code");
  const previewRef = useRef<HTMLIFrameElement>(null);
  const initialFocusRef = useRef(null);
  const [mouseEntered, setMouseEntered] = useState(false);
  const [allowPeeking, setAllowPeeking] = useState(true);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [prevWidth, setPrevWidth] = useState(0);
  const layout = useLayoutStore((state) => state.layout);

  useEffect(() => {
    setMousePos((p) => ({
      y: p.y,
      x: previewRef.current?.clientWidth || 0,
    }));
  }, [layout]);
  // TODO: add Touch support
  useEffect(() => {
    if (typeof window === "undefined") return;
    // set width to 100% when resized
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.borderBoxSize?.[0].inlineSize;
        if (typeof width === "number" && width !== prevWidth) {
          setPrevWidth(width);
          setMousePos((p) => ({
            y: p.y,
            x: previewRef.current?.clientWidth || 0,
          }));
        }
      }
    });
    observer.observe(previewRef.current!);
    window.addEventListener(
      "message",
      (event) => {
        if (event.data.type === "mouseenter") setMouseEntered(true);
        else if (event.data.type === "mouseleave") setMouseEntered(false);
        else if (event.data.type === "mousemove") {
          setMousePos({ x: event.data.x, y: event.data.y });
          setMouseEntered(true);
        }
      },
      false
    );
    return () => {
      // observer.disconnect();
      window.removeEventListener("message", () => {});
    };
  }, []);
  const targetSrcDoc = getSrcDoc(target);
  // TODO: add debouncing
  const sourceSrcDoc = getSrcDoc(source);
  return (
    <Box w={"full"} h={"full"} bg={"white"} pos={"relative"}>
      <Box w={"full"} h={"full"}>
        <iframe
          style={{
            position: "absolute",
          }}
          title="output"
          sandbox="allow-scripts"
          width={"100%"}
          height={"100%"}
          ref={previewRef}
          srcDoc={targetSrcDoc}
        ></iframe>
        <Box
          h={"full"}
          pos={"absolute"}
          width={
            view === "target"
              ? "0%"
              : mouseEntered && allowPeeking && view === "code"
              ? mousePos.x + "px"
              : "100%"
          }
          transition={!mouseEntered && allowPeeking ? `width 0.5s ease` : ""}
          overflow={"hidden"}
        >
          <iframe
            style={{
              display: view !== "target" ? "block" : "none",
              opacity:
                mouseEntered && allowPeeking && view === "code" ? 0.8 : 1,
              // filter: view === "diff" ? "invert(100%) opacity(50%)" : "none",
              mixBlendMode: view === "diff" ? "difference" : "unset",
              position: "absolute",
              transition: `width ${
                !mouseEntered && allowPeeking ? "0.5s" : "0s"
              } ease`,
            }}
            width={
              previewRef.current?.clientWidth
                ? previewRef.current?.clientWidth + "px"
                : "100%"
            }
            title="output"
            sandbox="allow-scripts"
            height={"100%"}
            srcDoc={sourceSrcDoc}
          ></iframe>

          {mouseEntered && allowPeeking && view === "code" && (
            <Box
              pos={"absolute"}
              h={"full"}
              w={"2px"}
              bg={"red.400"}
              // left={mouseEntered && allowPeeking ? mousePos.x + "px" : "100%"}
              right={0}
              top={0}
              pointerEvents={"none"}
            >
              <Popover
                isOpen={mouseEntered}
                placement="right"
                initialFocusRef={initialFocusRef}
              >
                <PopoverTrigger>
                  <Box
                    pos={"absolute"}
                    left={0}
                    top={mousePos.y + "px"}
                    zIndex={3}
                    pointerEvents={"none"}
                  ></Box>
                </PopoverTrigger>
                <PopoverContent
                  w={"fit-content"}
                  bg={"red.400"}
                  color={"white"}
                >
                  <PopoverArrow bg={"red.400"} />
                  <PopoverBody>
                    <Text ref={initialFocusRef}>{mousePos.x}px</Text>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Box>
          )}
        </Box>
      </Box>
      <PreviewSettings
        view={view}
        setView={setView}
        allowPeeking={allowPeeking}
        setAllowPeeking={setAllowPeeking}
      />
      {/* {mouseEntered && !showPreview && allowPeeking && ( <Box
            pos={"absolute"}
            h={"full"}
            w={"2px"}
            bg={"red.400"}
            left={mouseEntered && allowPeeking ? mousePos.x + "px" : "100%"}
            top={0}
            pointerEvents={"none"}
          >
            <Popover
              isOpen={mouseEntered}
              placement="right"
              initialFocusRef={initialFocusRef}
            >
              <PopoverTrigger>
                <Box
                  pos={"absolute"}
                  left={0}
                  top={mousePos.y + "px"}
                  zIndex={3}
                  pointerEvents={"none"}
                ></Box>
              </PopoverTrigger>
              <PopoverContent w={"fit-content"} bg={"red.400"} color={"white"}>
                <PopoverArrow bg={"red.400"} />
                <PopoverBody>
                  <Text ref={initialFocusRef}>{mousePos.x}px</Text>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
        )} */}
    </Box>
  );
}

export default CodePreview;
const PreviewSettings = ({
  view,
  setView,
  allowPeeking,
  setAllowPeeking,
}: {
  view: TView;
  setView: Dispatch<SetStateAction<TView>>;
  allowPeeking: boolean;
  setAllowPeeking: Dispatch<SetStateAction<boolean>>;
}) => {
  const [isMobile] = useMediaQuery("(max-width: 650px)");
  return (
    <Box
      pos={"absolute"}
      top={1}
      right={1}
      px={4}
      py={2}
      borderRadius={"10px"}
      shadow={"lg"}
      border={"1px solid #bbb"}
      background={"#ffffff88"}
      backdropFilter={"blur(3px)"}
      color={"black"}
      zIndex={1}
    >
      <HStack alignItems={"center"}>
        <Switcher view={view} setView={setView} />
      </HStack>
      {!isMobile && (
        <HStack alignItems={"center"} mt={2}>
          <Checkbox
            id="allow-peeking"
            colorScheme="purple"
            defaultChecked={allowPeeking}
            isInvalid
            onChange={(e) => setAllowPeeking(e.target.checked)}
          >
            Slide to compare
          </Checkbox>
        </HStack>
      )}
    </Box>
  );
};

const Switcher = ({
  view,
  setView,
}: {
  view: TView;
  setView: Dispatch<SetStateAction<TView>>;
}) => {
  return (
    <HStack
      position={"relative"}
      gap={2}
      w={"180px"}
      alignItems={"center"}
      justify={"space-evenly"}
      border={"2px solid #9F7AEA"}
      borderRadius={5}
      px={2}
    >
      <Box
        position={"absolute"}
        width={"60px"}
        height={"90%"}
        bg={"purple.400"}
        borderRadius={"5px"}
        left={view === "code" ? "2px" : view === "target" ? "62px" : "112px"}
        transition={"left .2s"}
      ></Box>
      <Button
        w={"60px"}
        variant={"ghost"}
        onClick={() => setView("code")}
        color={view === "code" ? "white" : "#333"}
        fontSize={".85rem"}
      >
        Output
      </Button>
      <Button
        w={"60px"}
        variant={"ghost"}
        onClick={() => setView("target")}
        color={view === "target" ? "white" : "#333"}
        fontSize={".85rem"}
      >
        Target
      </Button>
      <Button
        w={"60px"}
        variant={"ghost"}
        onClick={() => setView("diff")}
        color={view === "diff" ? "white" : "#333"}
        fontSize={".85rem"}
      >
        Diff
      </Button>
    </HStack>
  );
};

export const getSrcDoc = ({ css, html, head, js }: IContent) => {
  const origin =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://www.codingducks.xyz";

  return `
<html>
    <style>${css}</style>
    <body>
        ${html}
        <script>${js}</script>
        <script>
document.addEventListener('mouseenter', function(event) {
 const message = { type: 'mouseenter' };
 window.parent.postMessage(message, '${origin}'); 
});
document.addEventListener('mouseleave', function(event) {
 const message = { type: 'mouseleave' };
 window.parent.postMessage(message, '${origin}'); 
});
document.addEventListener('mousemove', function(event) {
 const message = { type: 'mousemove', x: event.clientX, y: event.clientY };
 window.parent.postMessage(message, '${origin}'); 
});
        </script>
    </body>
</html>`;
};

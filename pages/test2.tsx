import { Box, Button, Flex } from "@chakra-ui/react";
import { useRef, useState } from "react";
import Split from "react-split";
import { useSpring, animated } from "react-spring";

function TestPage() {
  const [animate, setAnimate] = useState(false);

  // const [sizes, setSizes] = useState([50, 50]);

  const springRef = useRef(null);

  const [style, api] = useSpring(() => ({
    from: {
      height: "0px",
      width: "0px",
      background: "cyan",
    },
    to: {
      height: "300px",
      width: "300px",
      background: "red",
    },
    config: {
      tension: 177,
      friction: 13,
      precision: 0.001,
    },
  }));
  // console.log(style);

  const toggle = () => {
    setAnimate((p) => !p);
    api.start({
      from: {
        height: springRef.current.style.height,
        width: springRef.current.style.width,
        background: animate ? "cyan" : "red",
      },
      to: {
        height: !animate ? "90px" : "300px",
        width: !animate ? "90px" : "300px",
        background: !animate ? "cyan" : "red",
      },
    });
  };
  return (
    <Box h={"100vh"} border={"2px solid red"}>
      <Split
        className="split-h"
        minSize={300}
        style={{ height: "100%", width: "100%" }}
      >
        <Flex
          w={"100%"}
          h={"100%"}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          fontSize={"5xl"}
        >
          1<Button onClick={toggle}>toggle</Button>
          {JSON.stringify(style)}
        </Flex>
        <Split
          className="split-v"
          minSize={150}
          style={{ height: "100%", width: "100%" }}
          direction="vertical"
        >
          <Flex
            w={"100%"}
            h={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
            fontSize={"5xl"}
          >
            2
          </Flex>
          <Flex
            w={"100%"}
            h={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
            fontSize={"5xl"}
          >
            <animated.div style={style} ref={springRef}></animated.div>2
          </Flex>
        </Split>
      </Split>
    </Box>
  );
}

export default TestPage;

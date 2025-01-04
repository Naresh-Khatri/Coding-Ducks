import {
  Box,
  Center,
  Flex,
  Text,
  keyframes,
  useMediaQuery,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import TypewriterComponent from "typewriter-effect";
import { isTouchScreen } from "../lib/utils";

const styles = {
  width: "fit-content",
  height: "fit-content",
  color: "white",
  fontSize: "18px",
  // padding: "20px",
  fontFamily: "Consolas,Courier New,monospace",
  backdropFilter: "blur(4px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  backgroundColor: "#111928bf",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,.125)",
  willChange: "transform",
};

const glowKeyframes = keyframes`
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
`;

function CodeTyper() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [isLargerThan800] = useMediaQuery("(min-width: 800px)");

  const resetEffect = useCallback(() => {
    setIsMouseOver(false);
    setTimeout(function () {
      if (!isMouseOver && cardRef.current) {
        cardRef.current.style.transition = "transform 1s";
        cardRef.current.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      }
    }, 300);
  }, []);

  // function to handle parallax effect when pointer moves over body
  // on large screens
  const parallax3DEffect = useCallback(
    (e: any) => {
      if (!cardRef.current) return;
      if (!isMouseOver) {
        cardRef.current.style.transition = "none";
      } else {
        cardRef.current.style.transition = "transform 0.3s";
      }
      var card = cardRef?.current;
      if (!card) return;
      var cardRect = card.getBoundingClientRect();
      var cardCenterX = cardRect.left + cardRect.width / 4;
      var cardCenterY = cardRect.top + cardRect.height / 4;

      var deltaX = e.clientX - cardCenterX;
      var deltaY = e.clientY - cardCenterY;

      var rotateX = -deltaY / 20;
      var rotateY = deltaX / 20;

      card.style.transform = `perspective(500px) rotateX( ${rotateX}deg) rotateY(${rotateY}deg)`;
    },
    [isMouseOver]
  );
  // only for touch devices with acl
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof Accelerometer === "undefined" ||
      !isTouchScreen() ||
      isLargerThan800 ||
      !cardRef.current
    )
      return;

    cardRef.current.style.transform = `perspective(500px) rotateX( 0deg) rotateY(0deg)`;
    cardRef.current.style.transition = "transform 0.15s";
    const acl = new Accelerometer({ frequency: 60 });
    acl.addEventListener("reading", () => {
      if (!cardRef.current || !acl.x || !acl.y) return;
      cardRef.current.style.transform = `perspective(500px) rotateX( ${
        acl.y * 3
      }deg) rotateY(${acl.x * 3}deg)`;
    });
    acl.start();
  }, [isLargerThan800]);

  // only for large screens without acl
  useEffect(() => {
    if (!isLargerThan800) return;
    document.body?.addEventListener("mousemove", parallax3DEffect);
    document.body?.addEventListener("mouseleave", resetEffect);
    document.body?.addEventListener("mouseenter", () => {
      setIsMouseOver(true);
    });

    return () => {
      document.body?.removeEventListener("mousemove", parallax3DEffect);
      document.body?.removeEventListener("mouseleave", resetEffect);
    };
  }, [isLargerThan800, resetEffect]);
  return (
    <Center w={"100%"} h={"100%"} className="yoo">
      <Box
        ref={cardRef}
        style={styles}
        css={{
          width: "220px",
          height: "50px",
          border: "none",
          outline: "none",
          color: "#fff",
          background: "#444",
          position: "relative",
          zIndex: "0",
          borderRadius: "10px",
          // rotate: "1 0 .5 45deg",
        }}
        _before={{
          content: `""`,
          background:
            "linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)",
          position: "absolute",
          top: "-2px",
          left: "-2px",
          backgroundSize: "400%",
          zIndex: "-1",
          filter: "blur(5px)",
          width: "calc(100% + 4px)",
          height: "calc(100% + 4px)",
          animation: `${glowKeyframes} 20s linear infinite`,
          transition: "opacity .3s ease-in-out",
          boxShadow: "0 4px 4px 0 #000000ff",
          borderRadius: "10px",
        }}
        _after={{
          zIndex: -1,
          content: `""`,
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "#222222fa",
          left: "0",
          top: "0",
          borderRadius: "10px",
        }}
      >
        <Flex
          alignItems={"center"}
          bg={"gray.700"}
          px={"20px"}
          h={"30px"}
          w={"100%"}
          borderRadius={"10px 10px 0 0"}
          // transform={"perspective(500px) translateZ(10px);"}
        >
          <svg
            height="12"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <circle
              cx="6"
              cy="6"
              r="6"
              fill="#FF5F56"
              stroke="#E0443E"
            ></circle>
            <circle
              cx="26"
              cy="6"
              r="6"
              fill="#FFBD2E"
              stroke="#DEA123"
            ></circle>
            <circle
              cx="46"
              cy="6"
              r="6"
              fill="#27C93F"
              stroke="#1AAB29"
            ></circle>
          </svg>
        </Flex>
        <Flex px={"20px"} h={"150px"}>
          <Text fontSize={{ base: "1xl", md: "2xl" }} as={"span"}>
            <TypewriterComponent
              options={{ loop: true }}
              onInit={(typewriter) => {
                typewriter
                  .typeString(
                    `<pre style='display: inline'><span role="presentation" style="padding-right: 0.1px;"><span style="color: #9fca56;">print</span>(<span style="color: #55b5db;">"hello world"</span>)</span></pre>`
                  )
                  .pauseFor(1000)
                  .deleteChars(13)
                  .typeString(
                    `<pre style='display: inline'><span style="color: #55b5db;">Welcome to<br> Coding Ducks!"</span></span>)</span></pre>`
                  )
                  .pauseFor(1000)
                  .deleteChars(26)
                  .typeString(
                    `<pre style='display: inline'><span style="color: #55b5db;">The best place to<br> start coding!"</span></span>)</span></pre>`
                  )
                  .pauseFor(1000)
                  .start();
              }}
            />
          </Text>
        </Flex>
      </Box>
    </Center>
  );
}

export default CodeTyper;

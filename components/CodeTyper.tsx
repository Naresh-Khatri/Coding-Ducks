import {
  Box,
  Center,
  Flex,
  Text,
  keyframes,
  useMediaQuery,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import TypewriterComponent from "typewriter-effect";

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
};

const glowKeyframes = keyframes`
    0% { background-position: 0 0; }
    50% { background-position: 400% 0; }
    100% { background-position: 0 0; }
`;

function CodeTyper() {
  const boxRef = useRef(null);
  const cardRef = useRef(null);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [data, setData] = useState({});
  const [isLargerThan800] = useMediaQuery("(min-width: 800px)");

  useEffect(() => {
    if (typeof window === "undefined" || isLargerThan800) return;

    cardRef.current.style.transform = `perspective(500px) rotateX( 0deg) rotateY(0deg)
        `;
    const acl = new Accelerometer({ frequency: 60 });
    acl.addEventListener("reading", () => {
      setData({
        x: acl.x.toFixed(5),
        y: acl.y.toFixed(5),
        z: acl.z.toFixed(5),
      });

      cardRef.current.style.transform = `perspective(500px) rotateX( ${
        acl.y * 2
      }deg) rotateY(${acl.x * 2}deg)`;
    });
    acl.start();
  }, [isLargerThan800]);

  useEffect(() => {
    if (!isLargerThan800) return;
    boxRef.current?.addEventListener("mousemove", parallax3DEffect);
    boxRef.current?.addEventListener("mouseleave", resetEffect);
    boxRef.current?.addEventListener("mouseenter", () => {
      setIsMouseOver(true);
    });

    return () => {
      if (boxRef.current) {
        boxRef?.current?.removeEventListener("mousemove", parallax3DEffect);
        boxRef?.current?.removeEventListener("mouseleave", resetEffect);
      }
    };
  }, [isLargerThan800]);
  const resetEffect = (e: any) => {
    setIsMouseOver(false);
    setTimeout(function () {
      if (!isMouseOver && cardRef.current) {
        cardRef.current.style.transition = "transform 1s";
        cardRef.current.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      }
    }, 300);
  };
  const parallax3DEffect = (e: any) => {
    if (!cardRef.current) return;
    if (!isMouseOver) {
      cardRef.current.style.transition = "none";
    } else {
      cardRef.current.style.transition = "transform 0.3s";
    }
    var card = cardRef?.current;
    if (!card) return;
    var cardRect = card.getBoundingClientRect();
    var cardCenterX = cardRect.left + cardRect.width / 2;
    var cardCenterY = cardRect.top + cardRect.height / 2;

    var deltaX = e.clientX - cardCenterX;
    var deltaY = e.clientY - cardCenterY;

    var rotateX = -deltaY / 10;
    var rotateY = deltaX / 10;

    card.style.transform = `perspective(500px) rotateX( ${rotateX}deg) rotateY(${rotateY}deg)`;
  };
  return (
    <Center ref={boxRef} w={"100%"} h={"100%"} className="yoo">
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

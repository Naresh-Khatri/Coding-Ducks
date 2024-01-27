import {
  Box,
  Center,
  Container,
  Flex,
  Spinner,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";
import Router from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";
import Image from "next/image";
function SplashScreen() {
  
  const logoImageRef = useRef(null);
  const bgRef = useRef(null);
  const [isLargerThan800] = useMediaQuery("(min-width: 800px)");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;
    let t4: NodeJS.Timeout;
    t1 = setTimeout(() => {
      logoImageRef.current.classList.add(
        isLargerThan800 ? "screen-end" : "screen-end-mobile"
      );
      t2 = setTimeout(() => {
        bgRef.current.classList.add("screen-bg-end");
      }, 500);
      t3 = setTimeout(() => {
        bgRef.current.style.display = "none";
      }, 900);
      t4 = setTimeout(() => {
        document.body.style.overflow = "auto";
      }, 1200);
    }, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isLargerThan800]);
  return (
    <Flex
      position="absolute"
      justifyContent={"center"}
      w={"100vw"}
      h={"100dvh"}
      ref={bgRef}
      className="splash-bg"
    >
      <Container
        maxW="container.xl"
        position={"relative"}
        alignItems={"center"}
        justifyContent={"center"}
        zIndex="100"
        h={"100dvh"}
        w="100vw"
        top={0}
        bottom={0}
      >
        <Image
          ref={logoImageRef}
          src="https://ik.imagekit.io/couponluxury/coding_ducks/logo_E_BOxGUcc.png"
          className={isLargerThan800 ? "splash-screen" : "splash-screen-mobile"}
          width={500}
          height={214}
          alt="logo"
        />
      </Container>
    </Flex>
  );
}

export default SplashScreen;

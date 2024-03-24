import { Container, Flex, useMediaQuery } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import Image from "next/image";
function SplashScreen() {
  const logoImageRef = useRef<HTMLImageElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [isLargerThan800] = useMediaQuery("(min-width: 800px)");

  useEffect(() => {
    // document.body.style.overflow = "hidden";
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;
    let t4: NodeJS.Timeout;
    t1 = setTimeout(() => {
      if (!logoImageRef.current) return;
      logoImageRef.current.classList.add(
        isLargerThan800 ? "screen-end" : "screen-end-mobile"
      );
      t2 = setTimeout(() => {
        if (!bgRef.current) return;
        bgRef.current.classList.add("screen-bg-end");
      }, 500);
      t3 = setTimeout(() => {
        if (!bgRef.current) return;
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
      w={"100%"}
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

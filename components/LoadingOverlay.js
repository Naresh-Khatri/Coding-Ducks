import { Box, Center, Spinner, Text } from "@chakra-ui/react";
import Router from "next/router";
import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
function LoadingOverlay(children) {
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const {loading: userIsLoading} = useContext(userContext)

  useEffect(()=>{
    setIsLoading(userIsLoading)
  }, [userIsLoading])
  Router.events.on("routeChangeStart", () => {
    clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        setIsLoading(true);
      }, 0)
    );
  });
  Router.events.on("routeChangeComplete", () => {
    clearTimeout(timer);
    setIsLoading(false);
  });
  return (
    <>
      {isLoading && (
        <Box
          position={"absolute"}
          zIndex="100"
          h={"100vh"}
          w="100vw"
          top={0}
          bottom={0}
          style={{ background: "#33333377" }}
        >
          <Center h={"100%"} flexDir="column" color={"white"}>
            <Spinner h={100} w={100} thickness={10} />
            <Text mt={5} fontSize={"xl"}>
              Waiting...
            </Text>
          </Center>
        </Box>
      )}
    </>
  );
}

export default LoadingOverlay;

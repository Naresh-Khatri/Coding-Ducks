import { Box, Center, Spinner, Text } from "@chakra-ui/react";
import Router from "next/router";
import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);
  const { loading: userIsLoading } = useContext(userContext);

  const RoutesWithLoadingHidden = ["/multiplayer", "/playground"];

  useEffect(() => {
    setIsLoading(userIsLoading);
  }, [userIsLoading]);
  Router.events.on("routeChangeStart", (route) => {
    if (!RoutesWithLoadingHidden.some((r) => route.includes(r))) {
      console.log("routeChangeStart", route);
      setIsLoading(true);
    }
  });
  Router.events.on("routeChangeComplete", () => {
    setIsLoading(false);
  });
  return (
    <>
      {isLoading && (
        <Box
          position={"fixed"}
          zIndex="100"
          h={"100vh"}
          w="100vw"
          top={0}
          bottom={0}
          style={{ background: "#33333377" }}
        >
          <Center h={"100%"} flexDir="column" color={"white"}>
            <Spinner h={100} w={100} thickness={"10px"} />
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

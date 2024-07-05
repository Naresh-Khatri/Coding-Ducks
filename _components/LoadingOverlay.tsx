import {
  Box,
  Center,
  Progress,
  Spinner,
  Text,
  Collapse,
  HStack,
} from "@chakra-ui/react";
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
      <Box
        position={"absolute"}
        h={"100vh"}
        w="100%"
        top={0}
        display={isLoading ? "block" : "none"}
      >
        <Progress
          isIndeterminate
          colorScheme="purple"
          h={1}
          bg={"transparent"}
        ></Progress>
        <Box pos={"absolute"} top={0} right={5} zIndex={10}>
          <Collapse in={isLoading} animateOpacity>
            <Box
              w={"200px"}
              p="4"
              color="white"
              mt="4"
              bg="purple.400"
              rounded="md"
              shadow="md"
            >
              <HStack>
                <Spinner />
                <Text fontWeight={"bold"}>Loading data...</Text>
              </HStack>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </>
  );
}

export default LoadingOverlay;

import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function ErrorPage404() {
  return (
    <Container maxW="container.md" h={"100dvh"} p={{ base: 10, lg: 40 }}>
      <Flex
        direction={{ base: "column", lg: "row" }}
        w={"full"}
        h={"100%"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Flex>
          <Flex
            direction={{ base: "row", lg: "column" }}
            justifyContent={"center"}
            alignItems={"center"}
            w={"100%"}
            h={"100%"}
          >
            <Text fontSize={"9xl"} lineHeight={1} fontWeight={"extrabold"}>
              4 0 4
            </Text>
          </Flex>
        </Flex>
        <Flex
          direction={"column"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Image
            src="https://ik.imagekit.io/couponluxury/b9eb2b42094811.57c019c4dd143_D0CjrE5ta.gif"
            alt="not found image"
            width={300}
            height={100}
          />
          <Text fontWeight={"bold"} fontSize={"3xl"}>
            Page not found
          </Text>
          <Link href={"https://codingducks.xyz"} style={{ width: "100%" }}>
            <Button colorScheme="purple" mt={4} w="full">
              Go Home
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Container>
  );
}

export default ErrorPage404;

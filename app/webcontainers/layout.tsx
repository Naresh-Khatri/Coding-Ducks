"use client";

import { Flex } from "@chakra-ui/react";

export default function GuestModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex flex={1} h={"100vh"}>
      {children}
    </Flex>
  );
}

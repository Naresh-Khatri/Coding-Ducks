import { Box, Center, Flex, Text } from "@chakra-ui/react";
import React from "react";
import AdminLayout from "../../layout/AdminLayout";

function index() {
  return (
    <>
      <AdminLayout>
        <Flex w={"100%"} h={"100%"}>
          <Center>
            <Text> Naise</Text>
          </Center>
        </Flex>
      </AdminLayout>
    </>
  );
}

export default index;

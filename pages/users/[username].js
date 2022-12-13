import { Container, Flex } from "@chakra-ui/react";
import React from "react";
import UserInfo from "../../components/UserInfo";

import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

function UsersPage({ user }) {
  console.log(user);
  return (
    <NormalLayout>
      <Container maxW={"8xl"}>
        <Flex justify={"center"} align="center">
          <UserInfo viewingUser={user} />
        </Flex>
      </Container>
    </NormalLayout>
  );
}

export const getServerSideProps = async (ctx) => {
  const { username } = ctx.params;
  const user = await getUserByUsername(username);
  return {
    props: {
      user,
    },
  };
};

const getUserByUsername = async (username) => {
  const user = await axios.get("/users/username/" + username);
  return user.data;
};

export default UsersPage;

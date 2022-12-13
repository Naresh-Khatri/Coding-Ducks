import { Container, Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import UserInfo from "../../components/UserInfo";

import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

function UsersPage({ username }) {
  // console.log(user);
  const [user, setUser] = useState();
  useEffect(() => {
    async function fetchUser() {
      const user = await getUserByUsername(username);
      setUser(user);
    }
    fetchUser();
  });
  return (
    <NormalLayout>
      <Container maxW={"8xl"}>
        <Flex justify={"center"} align="center">
          {user && <UserInfo viewingUser={user} />}
        </Flex>
      </Container>
    </NormalLayout>
  );
}

export const getServerSideProps = async (ctx) => {
  const { username } = ctx.params;
  // const user = await getUserByUsername(username);
  return {
    props: {
      // user,
      username,
    },
  };
};

const getUserByUsername = async (username) => {
  const user = await axios.get("/users/username/" + username);
  return user.data;
};

export default UsersPage;

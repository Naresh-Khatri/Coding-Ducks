import { Box, Container, Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import UserInfo from "../../components/UserInfo";
import UserStats from "../../components/UserStats";

import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

function UsersPage({ username }) {
  // console.log(user);
  const [user, setUser] = useState();
  const [progress, setProgress] = useState();
  useEffect(() => {
    async function fetchUser() {
      const user = await getUserByUsername(username);
      setUser(user);
      const progress = await getUserProgress(user.id);
      setProgress(progress);
    }
    fetchUser();
  }, []);
  return (
    <NormalLayout>
      <Container maxW={"8xl"} minH={"100vh"}>
        <Flex align="center" justify={"center"} w={"100%"} h={"100%"}>
          <Flex>{user && <UserInfo viewingUser={user} />}</Flex>
          <Flex flexGrow={1}>{progress && <UserStats progress={progress} />}</Flex>
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
const getUserProgress = async (userId) => {
  const user = await axios.get("/users/progress/" + userId);
  return user.data;
};

export default UsersPage;

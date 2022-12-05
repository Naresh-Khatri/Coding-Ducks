import { Container } from "@chakra-ui/react";
import React from "react";
import UserInfo from "../../components/UserInfo";

import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

function UsersPage({ user }) {
  
  return (
    <NormalLayout>
      <Container maxW={"8xl"}>
        <UserInfo viewingUser={user}/>
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

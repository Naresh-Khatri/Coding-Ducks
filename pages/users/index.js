import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import NormalLayout from "../../layout/NormalLayout";
import axios from "../../utils/axios";

function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("/users").then((data) => {
      setUsers(data.data);
    });
  }, []);
  //   console.log(users);
  return (
    <NormalLayout>
      <Container mt={70} maxW={"6xl"} minH={"100vh"}>
        <Text fontSize="4xl" fontWeight="bold" mb={10}>
          Users
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={10}>
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </SimpleGrid>
      </Container>
    </NormalLayout>
  );
}

const UserCard = ({ user }) => {
  return (
    <Link href={`/users/${user.username}`}>
      <Box
        w={"full"}
        h={200}
        position="relative"
        bg={useColorModeValue("white", "#111928bf")}
        boxShadow="2xl"
        backdropFilter="blur(4px) saturate(180%)"
        borderRadius="12px"
        border="1px solid rgba(255,255,255,.125)"
        _hover={{ backgroundColor: useColorModeValue("gray.100", "#111528") }}
      >
        <Box
          position="absolute"
          top={-10}
          left={"25%"}
          _hover={{ top: -55 }}
          transition="all .1s ease-in-out"
        >
          <Image
            src={user.photoURL}
            alt="Picture of the author"
            width={130}
            height={130}
            style={{ borderRadius: "50%" }}
          />
        </Box>
        <Flex mt={100} align="center" direction={"column"}>
          <Text fontWeight={"extrabold"} fontSize={"xl"}>
            {user.fullname}
          </Text>
          <Text color={"gray"}>@{user.username}</Text>
        </Flex>
      </Box>
    </Link>
  );
};

// export const getServerSideProps = async () => {
//   try {
//     // const { data } = await axios.get("/users");
//     const res = await fetch("/users");
//     const data = await res.json();
//     console.log(data);
//     return {
//       props: {
//         users: data,
//       },
//     };
//   } catch (err) {
//     console.log(err);
//     return {
//       props: {
//         users: [],
//       },
//     };
//   }
// };

export default UsersPage;

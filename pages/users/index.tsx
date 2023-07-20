import {
  Avatar,
  Box,
  Container,
  Flex,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useUsersData } from "../../hooks/useUsersData";
import NormalLayout from "../../layout/NormalLayout";
import SetMeta from "../../components/SEO/SetMeta";
import { IUser } from "../../types";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { baseURL } from "../../lib/axios";
import FAIcon from "../../components/FAIcon";

function UsersPage({
  users,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data, isLoading } = useUsersData({ initialUsers: users });
  return (
    <NormalLayout>
      <SetMeta
        title="Coding Ducks - Explore Coders and Users"
        description="Discover a vibrant community of coders and users on Coding Ducks. Explore user profiles, coding achievements, and contributions to the coding community."
        keywords="coders, users, user profiles, coding achievements, coding community, programming enthusiasts"
        url="https://www.codingducks.live/users"
      />
      <Container mt={70} maxW={"6xl"} minH={"100vh"}>
        <Text fontSize="4xl" fontWeight="bold" mb={10}>
          Users ({users.length})
        </Text>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
          {isLoading &&
            [...Array(20)].map((_, num) => <LoadingUserCard key={num} />)}
          {data?.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </SimpleGrid>
      </Container>
    </NormalLayout>
  );
}

const LoadingUserCard = () => {
  return (
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
        <Box position={"relative"}>
          <SkeletonCircle size="130px" />{" "}
        </Box>
      </Box>
      <Flex mt={100} align="center" direction={"column"}>
        <VStack>
          <Skeleton h={"20px"} w={"5em"} />
          <Skeleton h="14px" w={"4em"} />
          <Skeleton mt={3} h="20px" w={"1.5em"} />
        </VStack>
      </Flex>
    </Box>
  );
};
const UserCard = ({ user }: { user: IUser }) => {
  const rankColor = (rank: number) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "gray";
  };
  return (
    <Link href={`/users/${user.username}`}>
      <Flex
        w={"full"}
        my={1}
        justifyContent={"center"}
        h={{ base: 150, md: 200 }}
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
          top={{ base: -5, md: -10 }}
          _hover={{ top: -55 }}
          transition="all .1s ease-in-out"
        >
          <Box position={"relative"} w={{ base: 70, md: 120 }}>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Picture of the author"
                width={130}
                height={130}
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <Avatar
                size={{ base: "lg", md: "2xl" }}
                name={user.fullname}
                color={"white"}
              />
            )}

            {user.rank <= 3 && (
              <Box position={"absolute"} top={0} right={0}>
                <Box w={{ base: "7px", md: "20px" }}>
                  <FAIcon
                    icon={faStar}
                    size={"3x"}
                    color={rankColor(user.rank)}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        <Flex mt={{ base: 50, md: 100 }} align="center" direction={"column"}>
          <Text
            fontWeight={"extrabold"}
            fontSize={"xl"}
            noOfLines={1}
            textAlign="center"
          >
            {user.fullname}
          </Text>
          <Text color={"gray"}>@{user.username}</Text>
          <Text color={rankColor(user.rank)} fontSize="xl">
            #{user.rank}
          </Text>
        </Flex>
      </Flex>
    </Link>
  );
};

export const getServerSideProps: GetServerSideProps<{
  users: IUser[];
}> = async () => {
  try {
    const res = await fetch(baseURL + "/users");
    const { data: users } = (await res.json()) as { data: IUser[] };
    return {
      props: {
        users: users,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {
        users: [],
      },
    };
  }
};

export default UsersPage;

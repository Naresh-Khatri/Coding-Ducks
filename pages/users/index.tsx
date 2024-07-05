import {
  Avatar,
  AvatarBadge,
  Box,
  Container,
  Flex,
  keyframes,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { getUsers } from "../../hooks/useUsersData";
import NormalLayout from "../../layout/NormalLayout";
import SetMeta from "../../_components/SEO/SetMeta";
import { IUser } from "../../types";
import FAIcon from "../../_components/FAIcon";
import { dehydrate, QueryClient, useQuery } from "@tanstack/react-query";
import { pointsToLeague } from "../../lib/utils";
import { LEAGUES } from "../../data/leagues";

function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    refetchOnMount: true,
  }) as { data: IUser[]; isLoading: boolean };
  return (
    <NormalLayout>
      <SetMeta
        title="Coding Ducks - Explore Coders and Users"
        description="Discover a vibrant community of coders and users on Coding Ducks. Explore user profiles, coding achievements, and contributions to the coding community."
        keywords="coders, users, user profiles, coding achievements, coding community, programming enthusiasts"
        url="https://www.codingducks.xyz/users"
      />
      <Container mt={70} maxW={"6xl"} minH={"100vh"}>
        <Text fontSize="4xl" fontWeight="bold" mb={10}>
          Users ({users?.length})
        </Text>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={10}>
          {isLoading &&
            [...Array(20)].map((_, num) => <LoadingUserCard key={num} />)}
          {users?.map((user) => (
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
      borderRadius="0.8rem"
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
          <SkeletonCircle size="8rem" />{" "}
        </Box>
      </Box>
      <Flex mt={100} align="center" direction={"column"}>
        <VStack>
          <Skeleton h={"1.25rem"} w={"5em"} />
          <Skeleton h="0.8rem" w={"4em"} />
          <Skeleton mt={3} h="20px" w={"1.5em"} />
        </VStack>
      </Flex>
    </Box>
  );
};

const gradentKeyframs = keyframes` 
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
`;
const UserCard = ({ user }: { user: IUser }) => {
  const rankColor = (rank: number) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "darkorange";
    return "gray";
  };
  const bg1 = useColorModeValue("white", "#111928bf");
  const bg2 = useColorModeValue("gray.100", "#111528");
  if (!user.points || !user.rank) return <Text>stats not found</Text>;
  return (
    <Link href={`/users/${user.username}`}>
      <Flex
        w={"full"}
        my={1}
        justifyContent={"center"}
        h={{ base: 150, md: 200 }}
        position="relative"
        bg={bg1}
        boxShadow="2xl"
        backdropFilter="blur(4px) saturate(180%)"
        borderRadius="12px"
        border="1px solid rgba(255,255,255,.125)"
        _hover={{ backgroundColor: bg2 }}
      >
        <Box
          position="absolute"
          top={{ base: -5, md: -10 }}
          _hover={{ top: -55 }}
          transition="all .1s ease-in-out"
        >
          <Box position={"relative"} w={{ base: 70, md: 120 }}>
            <Avatar
              src={user.photoURL}
              size={{ base: "lg", md: "2xl" }}
              name={user.fullname}
              color={"white"}
            >
              <AvatarBadge
                bgSize={"contain"}
                bgGradient={LEAGUES[pointsToLeague(user.points).id].bgGradient}
                backgroundSize={"200%"}
                animation={`${gradentKeyframs} 5s ease infinite`}
                px={2}
                py={1}
                borderWidth="6px"
              >
                {/* <FAIcon icon={LEAGUES[pointsToLeague(user.points).id].icon} /> */}
                <Text fontSize={"sm"} fontWeight={"bold"}>
                  {LEAGUES[pointsToLeague(user.points).id].label}
                </Text>
              </AvatarBadge>
            </Avatar>
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
          <Text
            color={rankColor(user.rank)}
            fontSize="xl"
            fontWeight={rankColor(user.rank) !== "gray" ? "bold" : "normal"}
          >
            #{user.rank}
          </Text>
        </Flex>
      </Flex>
    </Link>
  );
};

export const getStaticProps = async () => {
  try {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(["users"], getUsers);
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {},
    };
  }
};

export default UsersPage;

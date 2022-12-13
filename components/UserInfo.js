import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";
import axios from "../utils/axios";
import FollowDetailsModal from "./FollowDetailsModal";
// import Link from "next/link";

function UserInfo({ viewingUser }) {
  const { user: loggedInUser } = useContext(userContext);
  const [viewingUserState, setViewingUserState] = useState(viewingUser);

  const { onOpen, onClose, isOpen } = useDisclosure();

  const [isFollowing, setIsFollowing] = useState(
    !!loggedInUser.following?.find((user) => user.id === viewingUser.id)
  );
  useEffect(() => {
    setIsFollowing(
      !!loggedInUser.following?.find((user) => user.id === viewingUser.id)
    );
  }, [loggedInUser.following, viewingUser.id]);

  const handleFollowBtnClick = async () => {
    if (isFollowing) {
      setIsFollowing(false);
      await axios.post("/users/unfollow", {
        fromUser: loggedInUser.id,
        toUser: viewingUser.id,
      });
    } else {
      setIsFollowing(true);
      await axios.post("/users/follow", {
        fromUser: loggedInUser.id,
        toUser: viewingUser.id,
      });
    }
    const { data } = await axios.get(
      `/users/username/${viewingUserState.username}`
    );
    setViewingUserState(data);
    console.log(viewingUserState);
  };

  // if (!loggedInUser.id) return <>Loading...</>;
  return (
    <Box w={"500px"} h={"600px"}>
      <FollowDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        followData={viewingUserState}
      />
      <Box
        borderRadius="5px"
        bg="purple.500"
        h={"150px"}
        alignItems="center"
        mb={"90px"}
      >
        <Flex justify="center">
          <Text
            bgGradient={[
              "linear(to-tr, teal.300, yellow.400)",
              "linear(to-t, blue.200, teal.500)",
              "linear(to-b, orange.100, purple.400)",
            ]}
            noOfLines={1}
            bgClip="text"
            fontSize="6xl"
            fontWeight="extrabold"
            position="absolute"
          >
            {viewingUserState.fullname}
          </Text>
        </Flex>

        <Center position="relative" h={150} w={"100%"}>
          <Image
            referrerPolicy="no-referrer"
            style={{ borderRadius: "50%", position: "absolute", top: 75 }}
            src={viewingUserState.photoURL}
            width={150}
            height={150}
            alt="profile"
          />
        </Center>
      </Box>

      <HStack spacing={4}>
        <VStack spacing={4} w="100%">
          <HStack spacing={4}>
            <Text fontSize="lg" fontWeight="semibold">
              {viewingUserState.fullname}
            </Text>
            <Text fontSize="sm" color="gray.500">
              @{viewingUserState.username}
            </Text>
          </HStack>
          <HStack>
            <Button
              disabled={!loggedInUser.id}
              bg={isFollowing ? "gray.700" : "purple.600"}
              color="white"
              onClick={handleFollowBtnClick}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          </HStack>

          <Divider />
          <HStack
            w="100%"
            justify="center"
            h={10}
            onClick={onOpen}
            cursor="pointer"
          >
            <Flex w="50%">
              <Box>
                <VStack>
                  <Text fontSize="md" fontWeight="extrabold">
                    {viewingUserState.followedBy.length || 0}
                  </Text>
                  <Text fontSize="sm" style={{ margin: 0 }} color="gray.500">
                    Followers
                  </Text>
                </VStack>
              </Box>
              <Spacer />
              <Box>
                <VStack>
                  <Text fontSize="md" fontWeight="extrabold">
                    {viewingUserState.following.length || 0}
                  </Text>
                  <Text fontSize="sm" style={{ margin: 0 }} color="gray.500">
                    following
                  </Text>
                </VStack>
              </Box>
              <Spacer />
              <Box>
                <VStack>
                  <Text fontSize="md" fontWeight="extrabold">
                    0
                  </Text>
                  <Text fontSize="sm" style={{ margin: 0 }} color="gray.500">
                    pulihora
                  </Text>
                </VStack>
              </Box>
            </Flex>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

export default UserInfo;

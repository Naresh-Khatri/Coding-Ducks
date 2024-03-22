"use client";
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  keyframes,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { LEAGUES } from "../../data/leagues";
import { userContext } from "../../contexts/userContext";
import axiosInstance from "../../lib/axios";
import FollowDetailsModal from "../FollowDetailsModal";
import { pointsToLeague } from "../../lib/utils";

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

function UserInfoCard({ viewingUser, viewingUserStats }) {
  const { user: loggedInUser } = useContext(userContext);
  const [viewingUserState, setViewingUserState] = useState(viewingUser);

  const { onOpen, onClose, isOpen } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState<boolean>(
    !!loggedInUser?.following?.find((user) => user.id === viewingUser.id)
  );
  useEffect(() => {
    setIsFollowing(
      // @ts-ignore
      !!loggedInUser?.following?.find((user) => user.id === viewingUser.id)
    );
    setViewingUserState(viewingUser);
    setIsLoading(false);
  }, [loggedInUser?.following, viewingUser, viewingUser.id]);

  const handleFollowBtnClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        setIsFollowing(false);
        await axiosInstance.post("/users/unfollow", {
          fromUser: loggedInUser && loggedInUser.id,
          toUser: viewingUser.id,
        });
      } else {
        setIsFollowing(true);
        await axiosInstance.post("/users/follow", {
          fromUser: loggedInUser && loggedInUser.id,
          toUser: viewingUser.id,
        });
      }
      const { data } = await axiosInstance.get(
        `/users/username/${viewingUserState.username}`
      );
      setViewingUserState(data.data);
      setIsLoading(false);
    } catch (error) {}
  };

  if (!viewingUserState) return null;

  return (
    <Box w={{ base: "100vw", md: "100%" }} mb={10}>
      <Box
        borderRadius="5px"
        bg="linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);"
        h={"fit-content"}
        alignItems="center"
        mb={"90px"}
        backgroundSize={"400% 400%"}
        animation={`${gradentKeyframs} 15s ease infinite`}
      >
        <Flex justify="center" display={{ base: "none", md: "flex" }}>
          <Text
            bgGradient={[
              // "linear(to-tr, teal.300, yellow.400)",
              "linear(to-r, blue.200, teal.500)",
              // "linear(to-b, orange.100, purple.400)",
            ]}
            noOfLines={1}
            bgClip="text"
            fontSize="6xl"
            fontWeight="extrabold"
            position="absolute"
          >
            {/* {viewingUserState.fullname} */}
          </Text>
        </Flex>

        <Center position="relative" h={150} w={"100%"}>
          <Avatar
            style={{ borderRadius: "50%", position: "absolute", top: 75 }}
            size="2xl"
            src={viewingUserState.photoURL}
            name={viewingUserState.fullname}
            referrerPolicy="no-referrer"
          >
            <AvatarBadge
              bgSize={"contain"}
              bgGradient={LEAGUES[viewingUserStats.league].bgGradient}
              backgroundSize={"200%"}
              animation={`${gradentKeyframs} 5s ease infinite`}
              px={2}
              py={1}
              borderWidth="6px"
              cursor={"pointer"}
            >
              <Popover size={"xl"}>
                <PopoverTrigger>
                  <Text fontSize="sm" fontWeight="bold">
                    {LEAGUES[pointsToLeague(viewingUser.points).id].label}
                  </Text>
                </PopoverTrigger>
                <Portal>
                  <PopoverContent w={"250px"}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody>
                      This user is on
                      <Text as={"span"} fontWeight={"bold"}>
                        {" "}
                        {LEAGUES[viewingUserStats.league].label}
                      </Text>
                      {" league."}
                    </PopoverBody>
                  </PopoverContent>
                </Portal>
              </Popover>
            </AvatarBadge>
          </Avatar>
        </Center>
      </Box>

      <HStack spacing={4}>
        <VStack spacing={4} w="100%">
          <HStack w={"100%"} justifyContent={"space-around"}>
            <VStack>
              <Text fontSize="lg" fontWeight="semibold">
                {viewingUserState.fullname}
              </Text>
              <Text fontSize="sm" color="gray.500">
                @{viewingUserState.username}
              </Text>
            </VStack>
            <HStack>
              <Button
                disabled={!loggedInUser?.id}
                bg={isFollowing ? "gray.700" : "purple.600"}
                color="white"
                onClick={handleFollowBtnClick}
                isLoading={isLoading}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </HStack>
          </HStack>

          <HStack
            mt={5}
            w="100%"
            justify="center"
            h={10}
            onClick={onOpen}
            cursor="pointer"
          >
            <FollowDetailsModal
              isOpen={isOpen}
              onClose={onClose}
              followData={viewingUserState}
            />
            <Flex w="50%">
              <Box>
                <VStack>
                  <Text fontSize="md" fontWeight="extrabold">
                    {viewingUserState.followedBy?.length || 0}
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
                    {viewingUserState.following?.length || 0}
                  </Text>
                  <Text fontSize="sm" style={{ margin: 0 }} color="gray.500">
                    following
                  </Text>
                </VStack>
              </Box>
              {/* <Spacer />
              <Box>
                <VStack>
                  <Text fontSize="md" fontWeight="extrabold">
                    0
                  </Text>
                  <Text fontSize="sm" style={{ margin: 0 }} color="gray.500">
                    pulihora
                  </Text>
                </VStack>
              </Box> */}
            </Flex>
          </HStack>
          <Divider />
        </VStack>
      </HStack>
    </Box>
  );
}

export default UserInfoCard;

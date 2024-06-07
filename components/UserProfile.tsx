"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";

import {
  faCrown,
  faEdit,
  faEye,
  faEyeSlash,
  faSignOut,
} from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useContext } from "react";
import { userContext } from "../contexts/userContext";
import EditProfileInModel from "./EditProfileInModel";
import Link from "next/link";
import FollowDetailsModal from "./FollowDetailsModal";
import FAIcon from "./FAIcon";
import UserAvatar from "./utils/UserAvatar";

function UserProfile() {
  const { user, loading, logout } = useContext(userContext);

  const [maskedEmail, setMaskedEmail] = useState("");
  const [isEmailMasked, setIsEmailMasked] = useState(true);

  useEffect(() => {
    if (user && user.email) {
      const emailParts = user.email.split("@");
      const maskedEmail = `${emailParts[0].slice(0, 2)}...@${emailParts[1]}`;
      setMaskedEmail(maskedEmail);
    }
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  // this will be used to show followers and following details
  const {
    isOpen: isFollowInfoOpen,
    onOpen: onFollowInfoOpen,
    onClose: onFollowInfoClose,
  } = useDisclosure();

  const profileEdited = () => {
    //TODO: add update profile logic
  };
  if (loading) return <>Loading...</>;
  if (!user)
    return (
      <Link href="/login">
        <Button color={"white"} bg="purple.600" _hover={{ bg: "purple.500" }}>
          Sign In
        </Button>
      </Link>
    );
  const { fullname, email, photoURL, isAdmin, username } = user;
  return (
    <Box>
      <HStack onClick={onOpen} cursor="pointer">
        <IconButton aria-label="profile picture" borderRadius={50}>
          <UserAvatar
            src={photoURL}
            name={username}
            w={40}
            h={40}
            alt="Profile Picture"
            style={{ borderRadius: "50%", width: "auto", height: "2.5rem" }}
          />
        </IconButton>
        <Flex>
          {isAdmin && (
            <Box color={"gold"}>
              <FAIcon icon={faCrown} />
            </Box>
          )}
        </Flex>
      </HStack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderRadius="5px" bg="purple.500">
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
              {fullname}
            </Text>

            <Divider mt={15} h={70}></Divider>
            <Center position="relative">
              <Box position={"absolute"}>
                <UserAvatar
                  src={photoURL}
                  w={150}
                  h={150}
                  height="150px"
                  alt="profile"
                  style={{ borderRadius: "50%", width: "150px" }}
                />
              </Box>
            </Center>
          </ModalHeader>
          {user && user.isAdmin && (
            <Link href="/dashboard">
              <Button
                position="absolute"
                top={2}
                right={2}
                bg="transparent"
                color="white"
                variant={"outline"}
                leftIcon={<FAIcon icon={faSignOut} />}
              >
                Dashboard
              </Button>
            </Link>
          )}
          <ModalBody mt={70}>
            {isEditing ? (
              <EditProfileInModel onCancel={() => setIsEditing(false)} />
            ) : (
              <HStack spacing={4}>
                <VStack spacing={4} w="100%">
                  <HStack spacing={4}>
                    <Text fontSize="lg" fontWeight="semibold">
                      {fullname}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {username}
                    </Text>
                  </HStack>
                  <Box>
                    <HStack>
                      <Text fontSize="sm" color="gray.500">
                        {isEmailMasked ? maskedEmail : email}
                      </Text>
                      <IconButton
                        aria-label="unmask email"
                        variant="outline"
                        icon={
                          <FAIcon icon={isEmailMasked ? faEye : faEyeSlash} />
                        }
                        size="sm"
                        onClick={() => setIsEmailMasked((p) => !p)}
                      />
                    </HStack>
                  </Box>
                  <Divider />
                  {!!user.followedBy && (
                    <>
                      <FollowDetailsModal
                        isOpen={isFollowInfoOpen}
                        onClose={onFollowInfoClose}
                        followData={user}
                      />
                      <HStack
                        w="100%"
                        justify="center"
                        h={10}
                        onClick={onFollowInfoOpen}
                        cursor="pointer"
                      >
                        <Flex w="50%">
                          <Box>
                            <VStack>
                              <Text fontSize="md" fontWeight="extrabold">
                                {user.followedBy?.length || 0}
                              </Text>
                              <Text
                                fontSize="sm"
                                style={{ margin: 0 }}
                                color="gray.500"
                              >
                                Followers
                              </Text>
                            </VStack>
                          </Box>
                          <Spacer />
                          <Box>
                            <VStack>
                              <Text fontSize="md" fontWeight="extrabold">
                                {user.following?.length || 0}
                              </Text>
                              <Text
                                fontSize="sm"
                                style={{ margin: 0 }}
                                color="gray.500"
                              >
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
                              <Text
                                fontSize="sm"
                                style={{ margin: 0 }}
                                color="gray.500"
                              >
                                pulihora
                              </Text>
                            </VStack>
                          </Box> */}
                        </Flex>
                      </HStack>
                    </>
                  )}
                </VStack>
              </HStack>
            )}
            {!isEditing && (
              <Flex m={2} justify="space-between">
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => {
                    logout();
                    toast({
                      title: "Logged out",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  <FAIcon icon={faSignOut} height={"1.3rem"} />
                  Logout
                </Button>

                <Button
                  colorScheme="purple"
                  bg={"purple.600"}
                  _hover={{ bg: "purple.700" }}
                  color="white"
                  onClick={() => setIsEditing((p) => !p)}
                >
                  <FAIcon icon={faEdit} height={"1.3rem"} />
                  Edit
                </Button>
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default UserProfile;

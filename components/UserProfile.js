import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

function UserProfile() {
  const { user, logout } = useContext(userContext);
  const { fullname, email, roll, photoURL, isAdmin, username } = user;

  const [maskedEmail, setMaskedEmail] = useState("");
  const [isEmailMasked, setIsEmailMasked] = useState(true);

  useEffect(() => {
    if (email) {
      const emailParts = email.split("@");
      const maskedEmail = `${emailParts[0].slice(0, 2)}...@${emailParts[1]}`;
      setMaskedEmail(maskedEmail);
    }
  }, [email]);

  const [isEditing, setIsEditing] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  // this will be used to show followers and following details
  const {
    isOpen: isFollowInfoOpen,
    onOpen: onFollowInfoOpen,
    onClose: onFollowInfoClose,
  } = useDisclosure();

  const profileEdited = () => {
    //TODO: add update profile logic
  };
  if (!photoURL) return <>Loading...</>;
  return (
    <Box>
      <HStack onClick={onOpen} cursor="pointer">
        <IconButton borderRadius={50}>
          <Avatar>
            <Image
              src={photoURL}
              alt="Profile Picture"
              width={200}
              height={100}
              style={{ borderRadius: "50%" }}
            />
          </Avatar>
        </IconButton>
        <Flex direction={"column"} alignItems="center">
          <Flex>
            <Text fontWeight={"extrabold"}>{fullname}</Text>
            {isAdmin && (
              <Box color={"gold"}>
                <FontAwesomeIcon icon={faCrown} height={20} />
              </Box>
            )}
          </Flex>
          <Text>{roll}</Text>
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
              <Image
                referrerPolicy="no-referrer"
                style={{ borderRadius: "50%", position: "absolute" }}
                src={photoURL}
                width={150}
                height={150}
                alt="profile"
              />
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
                icon={<FontAwesomeIcon icon={faSignOut} />}
              >
                Dashboard
              </Button>
            </Link>
          )}
          <ModalBody mt={70}>
            {isEditing ? (
              <EditProfileInModel
                onCancel={() => setIsEditing(false)}
                // onSuccess={profileEdited}
              />
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
                        variant="outline"
                        icon={
                          <FontAwesomeIcon
                            icon={isEmailMasked ? faEye : faEyeSlash}
                          />
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
                          <Spacer />
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
                          </Box>
                        </Flex>
                      </HStack>
                    </>
                  )}
                </VStack>
              </HStack>
            )}
            {!isEditing && (
              <Flex m={2} justify="space-between">
                <Button colorScheme="red" variant="outline" onClick={logout}>
                  <FontAwesomeIcon icon={faSignOut} height={"1.3rem"} />
                  Logout
                </Button>

                <Button
                  colorScheme="purple"
                  bg={"purple.600"}
                  _hover={{ bg: "purple.700" }}
                  color="white"
                  onClick={() => setIsEditing((p) => !p)}
                >
                  <FontAwesomeIcon icon={faEdit} height={"1.3rem"} />
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

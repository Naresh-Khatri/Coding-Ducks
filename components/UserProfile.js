import { useState } from "react";
import {
  Avatar,
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
import { logout } from "../firebase/firebase";
import EditProfileInModel from "./EditProfileInModel";

function UserProfile() {
  const { user } = useContext(userContext);
  const { fullname, email, photoURL, isAdmin } = user;

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

  const profileEdited = () => {
    //TODO: add update profile logic
  };
  if (!photoURL) return <>Loading...</>;
  return (
    <Box>
      <HStack>
        <IconButton borderRadius={50}>
          <Avatar onClick={onOpen}>
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
          <Text fontWeight={"extrabold"}>{fullname}</Text>
          {isAdmin ? (
            <HStack alignItems={"center"} color="gold">
              <FontAwesomeIcon icon={faCrown} height={20} />
              <Text>Admin</Text>
            </HStack>
          ) : (
            <HStack>k</HStack>
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
                      username
                      {/* {username} */}
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
                  <HStack w="100%" justify="center" h={10}>
                    <Flex w="50%">
                      <Box>
                        <VStack>
                          <Text fontSize="md" fontWeight="extrabold">
                            23.4K
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
                            4.5K
                          </Text>
                          <Text
                            fontSize="sm"
                            style={{ margin: 0 }}
                            color="gray.500"
                          >
                            Likes
                          </Text>
                        </VStack>
                      </Box>
                      <Spacer />
                      <Box>
                        <VStack>
                          <Text fontSize="md" fontWeight="extrabold">
                            423.2K
                          </Text>
                          <Text
                            fontSize="sm"
                            style={{ margin: 0 }}
                            color="gray.500"
                          >
                            Views
                          </Text>
                        </VStack>
                      </Box>
                    </Flex>
                  </HStack>
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

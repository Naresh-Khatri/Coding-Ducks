import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
  HStack,
  Avatar,
  AvatarBadge,
  IconButton,
  Center,
} from "@chakra-ui/react";

import { SmallCloseIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";

export default function EditUserProfile() {

  const [firebaseUser, setFirebaseUser] = useState({})
  const [profilePhoto, setProfilePhoto] = useState("");
  const router = useRouter();

  const [user, loading, error] = useAuthState(auth)
  const displayNameRef = useRef(null)
  const rollRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user) {
      setFirebaseUser(user)
      setProfilePhoto(user.photoURL);
      displayNameRef.current.value = user.displayName
    }
  })
  const handleCancelClick = () => {
    router.push("/");
  };
  const handleSubmitClick = () => {
    console.log("submit clicked", displayNameRef.current.value,
      firebaseUser.email, profilePhoto);
  };
  useEffect(() => {
    //TODO: check if user already present in db
  }, []);

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack
        spacing={4}
        w={"full"}
        maxW={"md"}
        bg={useColorModeValue("white", "gray.700")}
        rounded={"xl"}
        boxShadow={"lg"}
        p={6}
        my={12}
      >
        <Heading lineHeight={1.1} fontSize={{ base: "2xl", sm: "3xl" }}>
          User Profile Edit
        </Heading>
        <FormControl id="userName">
          {/* <FormLabel>Profile Photo</FormLabel> */}
          <Stack direction={["column", "row"]} spacing={6}>
            <Center>
              <Avatar size="xl" src={profilePhoto}>
                <AvatarBadge
                  disabled
                  as={IconButton}
                  size="sm"
                  rounded="full"
                  top="-10px"
                  colorScheme="red"
                  aria-label="remove Image"
                  icon={<SmallCloseIcon />}
                />
              </Avatar>
            </Center>
            <Center w="full">
              <Button w="full" disabled>
                Change Photo
              </Button>
            </Center>
          </Stack>
        </FormControl>
        <FormControl id="userName" isRequired>
          <FormLabel>Full name</FormLabel>
          <Input
            placeholder="FullName"
            _placeholder={{ color: "gray.500" }}
            type="text"
            ref={displayNameRef}
          />
        </FormControl>
        <FormControl id="roll" isRequired>
          <FormLabel>Roll No.</FormLabel>
          <Input
            placeholder="22FH1A0---"
            _placeholder={{ color: "gray.500" }}
            type="text"
            ref={rollRef}
          />
        </FormControl>
        <FormControl id="email" isRequired>
          <FormLabel>Email address</FormLabel>
          {firebaseUser.email &&
            <Input
              placeholder="your-email@example.com"
              _placeholder={{ color: "gray.500" }}
              type="email"
              disabled
              value={firebaseUser?.email}
            />
          }
        </FormControl>
        <Stack spacing={6} direction={["column", "row"]}>
          <Button
            bg={"red.400"}
            color={"white"}
            w="full"
            _hover={{
              bg: "red.500",
            }}
            onClick={handleCancelClick}
          >
            Cancel
          </Button>
          <Button
            bg={"blue.400"}
            color={"white"}
            w="full"
            _hover={{
              bg: "blue.500",
            }}
            onClick={handleSubmitClick}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </Flex>
  );
}

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
  useToast,
} from "@chakra-ui/react";

import { SmallCloseIcon } from "@chakra-ui/icons";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useContext } from "react";
import { userContext } from "../contexts/userContext";
import ThemeToggler from "../components/ThemeToggler";
import Image from "next/image";

import axios from "../utils/axios";
import { logout } from "../firebase/firebase";

export default function EditUserProfile() {
  const toast = useToast();
  const router = useRouter();
  const { user, firebaseUser, loading } = useContext(userContext);

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [roll, setRoll] = useState("");

  useEffect(() => {
    // if not loading, firebaseuser null and user null, redirect to login
    if (!loading && !firebaseUser && Object.keys(user).length == 0)
      router.push("/");

    if (firebaseUser) {
      setFullname(firebaseUser.displayName);
    }
    // if (!loading && Object.keys(user) == 0) router.push("/login");
    // checking for googleUID in the user object to make sure used is in db
    if (user.googleUID) router.push("/home");
  }, [user, firebaseUser, router, loading]);
  const handleCancelClick = () => {
    router.push("/");
  };
  const handleSubmitClick = async () => {
    // console.log("submit clicked", fullnameRef.current.value, user.email);

    try {
      const payload = {
        fullname,
        username,
        roll,
        photoURL: firebaseUser.photoURL,
        googleUID: firebaseUser.uid,
        email: firebaseUser.email,
      };
      const res = await axios.post("/users", payload);
      toast({
        title: "User Created!",
        description: "We've created your account for you.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      router.push("/home");
    } catch (error) {
      if (error.response.data.code == 69)
        toast({
          title: "User already exists",
          description: "Please try a different email/username/roll",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

      console.log(error);
    }
  };

  const color1 = useColorModeValue("gray.50", "gray.800");
  const color2 = useColorModeValue("white", "gray.700");
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!firebaseUser || loading) return <>Loading...</>;

  return (
    <>
      <Flex minH={"100vh"} align={"center"} justify={"center"} bg={color1}>
        <Stack
          spacing={4}
          w={"full"}
          maxW={"md"}
          bg={color2}
          rounded={"xl"}
          boxShadow={"lg"}
          p={6}
          my={12}
        >
          <Flex w={"100%"} justifyContent="space-between">
            <ThemeToggler />
            <Button
              variant="outline"
              colorScheme="red"
              alignSelf="flex-end"
              onClick={handleLogout}
            >
              Not you?
            </Button>
          </Flex>
          <Heading lineHeight={1.1} fontSize={{ base: "2xl", sm: "3xl" }}>
            User Profile Edit
          </Heading>
          <FormControl id="userName">
            {/* <FormLabel>Profile Photo</FormLabel> */}
            <Stack direction={["column", "row"]} spacing={6}>
              <Center>
                <Avatar size="xl">
                  <Image
                    src={firebaseUser.photoURL}
                    referrerPolicy="no-referrer"
                    width={100}
                    height={100}
                    alt="profile photo"
                    style={{ borderRadius: "50%" }}
                  />
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
          <FormControl id="fullname" isRequired>
            <FormLabel>Full name</FormLabel>
            <Input
              placeholder="Enter your fullname"
              _placeholder={{ color: "gray.500" }}
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </FormControl>
          <FormControl id="userName" isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              placeholder="Enter your username"
              _placeholder={{ color: "gray.500" }}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl id="roll" isRequired>
            {/* TODO: check username availability */}
            <FormLabel>Roll No.</FormLabel>
            <Input
              placeholder="22FH1A0---"
              _placeholder={{ color: "gray.500" }}
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
            />
          </FormControl>
          <FormControl id="email" isRequired>
            <FormLabel>Email address</FormLabel>
            {firebaseUser.email && (
              <Input
                placeholder="your-email@example.com"
                _placeholder={{ color: "gray.500" }}
                type="email"
                disabled
                value={firebaseUser.email}
              />
            )}
          </FormControl>
          <Stack spacing={6} direction={["column", "row"]}>
            <Button
              color={"white"}
              w="full"
              variant={"ghost"}
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
            <Button
              bg={"purple.400"}
              color={"white"}
              w="full"
              _hover={{
                bg: "purple.500",
              }}
              onClick={handleSubmitClick}
            >
              Submit
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </>
  );
}

import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { userContext } from "../contexts/userContext";

function EditProfileInModel({ onCancel, onSubmit }) {
  const { user, updateUser } = useContext(userContext);

  const [fullname, setFullname] = useState(user.fullname || "");
  const [newRoll, setNewRoll] = useState(user.roll || "");
  const [newEmail, setNewEmail] = useState(user.email || "");
  const [newUsername, setNewUsername] = useState(user.username || "");
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isRollValid, setIsRollValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
  const rollRegex = /^[0-9]{2}[a-zA-Z]{2}[0-9]{1}[a-zA-Z0-9]{5}$/;
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const color = useColorModeValue("white", "gray.700");

  const toast = useToast();
  const updateProfile = async () => {
    console.log("update profile");
    const payload = {};
    if (user.fullname !== fullname) payload.fullname = fullname;
    if (user.roll !== newRoll) payload.roll = newRoll;
    if (user.email !== newEmail) payload.email = newEmail;
    if (user.username !== newUsername) payload.username = newUsername;

    try {
      const res = await updateUser(payload);
      toast({
        title: "Profile Updated!",
        description: "We've updated your profile for you.",
        position: "top-right",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      onCancel();
    } catch (error) {
      console.log(error);
      toast({
        title: "Error Updating Profile!",
        description: "We've encountered an error while updating your profile.",
        position: "top-right",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };
  useEffect(() => {
    handleRollChange({ target: { value: newRoll } });
    handleUsernameChange({ target: { value: newUsername } });
    handleEmailChange({ target: { value: newEmail } });
  });
  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setNewUsername(username);
    if (usernameRegex.test(username)) {
      setIsUsernameValid(true);
    } else {
      setIsUsernameValid(false);
    }
  };
  const handleRollChange = (e) => {
    const roll = e.target.value;
    setNewRoll(roll);
    if (rollRegex.test(roll) && roll.length == 10) {
      setIsRollValid(true);
    } else {
      setIsRollValid(false);
    }
  };
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setNewEmail(email);
    if (emailRegex.test(email)) {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(false);
    }
  };

  return (
    <Stack
      spacing={4}
      w={"full"}
      maxW={"md"}
      bg={color}
      rounded={"xl"}
      boxShadow={"lg"}
      p={6}
    >
      <Heading fontSize={{ base: "2xl", sm: "3xl" }}>User Profile Edit</Heading>
      <FormControl id="fullname" isRequired>
        <FormLabel>Full Name</FormLabel>
        <Input
          type="text"
          placeholder="Enter your new name"
          _placeholder={{ color: "gray.500" }}
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
      </FormControl>
      <FormControl id="userName" isRequired>
        <FormLabel>Username</FormLabel>
        <Input
          type="text"
          placeholder="Enter your new Username"
          _placeholder={{ color: "gray.500" }}
          value={newUsername}
          errorBorderColor="crimson"
          focusBorderColor={isUsernameValid ? "green.500" : "red.500"}
          isInvalid={!isUsernameValid}
          onChange={(e) => handleUsernameChange(e)}
        />
      </FormControl>
      <FormControl id="email" isRequired>
        <FormLabel>Email address</FormLabel>
        <Input
          placeholder="Enter your new Email"
          _placeholder={{ color: "gray.500" }}
          value={newEmail}
          errorBorderColor="crimson"
          focusBorderColor={isEmailValid ? "green.500" : "red.500"}
          isInvalid={!isEmailValid}
          onChange={(e) => handleEmailChange(e)}
          type="email"
        />
      </FormControl>
      <FormControl id="roll" isRequired>
        <FormLabel>Roll No.</FormLabel>
        <Input
          placeholder="Enter your new Roll No."
          _placeholder={{ color: "gray.500" }}
          value={newRoll}
          errorBorderColor="crimson"
          focusBorderColor={isRollValid ? "green.500" : "red.500"}
          isInvalid={!isRollValid}
          onChange={(e) => handleRollChange(e)}
        />
      </FormControl>
      <Stack spacing={6} direction={["column", "row"]}>
        <Button
          bg={"red.400"}
          color={"white"}
          w="full"
          _hover={{ bg: "red.500" }}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          bg={"purple.500"}
          color={"white"}
          w="full"
          _hover={{ bg: "purple.600" }}
          onClick={updateProfile}
          disabled={
            !isRollValid ||
            !isUsernameValid ||
            !isEmailValid ||
            !fullname ||
            !newEmail ||
            !newRoll ||
            !newUsername
          }
        >
          Submit
        </Button>
      </Stack>
    </Stack>
  );
}

export default EditProfileInModel;

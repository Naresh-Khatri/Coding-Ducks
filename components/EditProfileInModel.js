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
import { useContext, useState } from "react";
import { userContext } from "../contexts/userContext";

function EditProfileInModel({ onCancel, onSubmit }) {
  const { user, updateUser } = useContext(userContext);

  const [fullname, setFullname] = useState(user.fullname || "");
  const [newRoll, setNewRoll] = useState(user.roll || "");
  const [newEmail, setNewEmail] = useState(user.email || "");
  const [newUsername, setNewUsername] = useState(user.username || "");

  const color = useColorModeValue("white", "gray.700");

  const toast = useToast();
  const updateProfile = async () => {
    console.log("update profile");
    const payload = {
      fullname: fullname,
      roll: newRoll,
      email: newEmail,
      username: newUsername,
    };
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
          onChange={(e) => setNewUsername(e.target.value)}
        />
      </FormControl>
      <FormControl id="email" isRequired>
        <FormLabel>Email address</FormLabel>
        <Input
          placeholder="Enter your new Email"
          _placeholder={{ color: "gray.500" }}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
        />
      </FormControl>
      <FormControl id="roll" isRequired>
        <FormLabel>Roll No.</FormLabel>
        <Input
          placeholder="Enter your new Roll No."
          _placeholder={{ color: "gray.500" }}
          value={newRoll}
          onChange={(e) => setNewRoll(e.target.value)}
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
        >
          Submit
        </Button>
      </Stack>
    </Stack>
  );
}

export default EditProfileInModel;

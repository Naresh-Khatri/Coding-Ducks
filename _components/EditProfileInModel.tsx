import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useRef, useState } from "react";
import { userContext } from "../contexts/userContext";

import { createAspectRatio, Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import axios from "../lib/axios";
import FAIcon from "./FAIcon";

interface ProfileUpdatePayload {
  fullname?: string;
  roll?: string;
  email?: string;
  username?: string;
  photoURL?: string;
}
interface EditProfileInModelProps {
  onCancel: () => void;
  onSubmit?: () => void;
}
function EditProfileInModel({ onCancel, onSubmit }: EditProfileInModelProps) {
  const { user, updateUser, loadUser } = useContext(userContext);

  const [fullname, setFullname] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isRollValid, setIsRollValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const [newProfilePicture, setNewProfilePicture] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cropperRef = useRef<CropperRef>(null);
  const [isLoading, setIsLoading] = useState(false);

  const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
  const rollRegex = /^[0-9]{2}[a-zA-Z]{2}[0-9]{1}[a-zA-Z0-9]{5}$/;
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const color = useColorModeValue("white", "gray.700");

  const toast = useToast();
  const updateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    const payload: ProfileUpdatePayload = {};
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
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };
  const UploadProfilePicture = async () => {
    if (!cropperRef.current) return;

    setIsLoading(true);
    const convertCanvasToBlob = (canvas: any): Promise<Blob> => {
      return new Promise((resolve) => {
        canvas.toBlob((blob: Blob) => {
          resolve(blob);
        });
      });
    };
    try {
      const formData = new FormData();
      formData.append(
        "newProfilePicture",
        await convertCanvasToBlob(cropperRef.current.getCanvas())
      );
      const res = await axios.post("/users/uploadProfilePicture", formData);
      console.log(res);
      toast({
        title: "Profile Picture Updated!",
        description: "We've updated your profile picture for you.",
        position: "top-right",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      onCancel();
      loadUser();
      setIsLoading(false);
    } catch (err) {
      toast({
        title: "Error Updating Profile Picture!",
        description:
          "We've encountered an error while updating your profile picture.",
        position: "top-right",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setIsLoading(false);
      console.log(err);
    }
  };

  const onFileChange = (e) => {
    if (!e.target) return;
    console.log(e);
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    console.log(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      // @ts-check
      setNewProfilePicture("" + e.target);
    };
  };

  useEffect(() => {
    if (!user) return;
    setFullname(user.fullname || "");
    setNewProfilePicture(user.photoURL || "");
    handleRollChange({ target: { value: user.roll } });
    handleUsernameChange({ target: { value: user.username } });
    handleEmailChange({ target: { value: user.email } });
  }, [user]);
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
      pb={6}
      px={6}
    >
      <Button onClick={onOpen}>change photo</Button>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        closeOnEsc={!isLoading}
        closeOnOverlayClick={!isLoading}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Profile Picture</ModalHeader>

          <ModalCloseButton isDisabled={isLoading} />
          <ModalBody w={"100%"}>
            {!newProfilePicture ? (
              <>
                <Input type="file" accept="image/*" onChange={onFileChange} />
                {/* <Button  */}
              </>
            ) : (
              <Flex position={"relative"} w={"100%"}>
                <Cropper
                  ref={cropperRef}
                  src={newProfilePicture}
                  onChange={onFileChange}
                  className={"cropper"}
                  aspectRatio={createAspectRatio(1)}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
                <IconButton
                  aria-label="Delete Profile Picture"
                  isLoading={isLoading}
                  position={"absolute"}
                  zIndex={1}
                  top={-5}
                  right={-5}
                  icon={<FAIcon icon={faTrash} />}
                  bg="red.300"
                  color="white"
                  onClick={() => setNewProfilePicture("")}
                />
                {/* <img src={coverImg} alt="cover image" /> */}
              </Flex>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={onClose}
              isDisabled={isLoading}
            >
              Close
            </Button>
            <Button
              variant="ghost"
              onClick={UploadProfilePicture}
              isLoading={isLoading}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
          isLoading={isLoading}
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

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import { userContext } from "../contexts/userContext";

function ForgotPassword() {
  const toast = useToast();
  const router = useRouter();
  const { sendPasswordReset } = useContext(userContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleOnChangeEmail = (e) => {
    const email = e.target.value;
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    setEmail(email);
    if (emailRegex.test(email)) {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(false);
    }
  };
  const handleBtnClick = async () => {
    try {
      setLoading(true);
      await sendPasswordReset(email);
      toast({
        title: "Link Sent!",
        description: "Password reset link send to your email.\nOpening Gmail in new tab.",
        position: "top-right",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      setEmail("");
      setLoading(false);
      setTimeout(() => {
        window.open("https://gmail.com", '_blank');
        // router.push('https://gmail.com' )
        onClose();
      }, 3000);
    } catch (err) {
      toast({
        title: "Sending failed!",
        description: "Couldn't send reset link.",
        position: "top-right",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  return (
    <>
      <Button variant="link" colorScheme="blue" size="sm" onClick={onOpen}>
        Forgot password?
      </Button>
      <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Forgot your password?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            We&lsquo;ll email you a password reset link.
            <Input
              mt={5}
              value={email}
              placeholder="your@email.com"
              onChange={handleOnChangeEmail}
              errorBorderColor="crimson"
              focusBorderColor={isEmailValid ? "green.500" : "red.500"}
              isInvalid={!isEmailValid && email !== ""}
            />
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              close
            </Button>
            <Button
              colorScheme="blue"
              isLoading={loading}
              onClick={handleBtnClick}
            >
              Email reset link
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ForgotPassword;

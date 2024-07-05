import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  VisuallyHidden,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import React from "react";
import { GoogleIcon } from "./icons/Google";
import { TwitterIcon } from "./icons/Twitter";
import { GitHubIcon } from "./icons/GitHub";
import { signInWithGoogle } from "../../firebase/firebase";

const providers = [
  {
    name: "Google",
    icon: <GoogleIcon />,
  },
  {
    name: "Twitter",
    icon: <TwitterIcon />,
  },
  {
    name: "GitHub",
    icon: <GitHubIcon />,
  },
];
function SocialLogin() {
  const toast = useToast();
  const handleSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      toast({
        title: `Logged in as ${user.displayName}!`,
        position: "top-right",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: `Logged in as $ {user}!`,
        position: "top-right",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }
  };
  return (
    <Box
      bg={useBreakpointValue({ base: "transparent", sm: "bg-surface" })}
      borderRadius={{ base: "none", sm: "xl" }}
    >
      <Stack spacing="6">
        <ButtonGroup variant="outline" spacing="4" width="full">
          {providers.map(({ name, icon }) => (
            <Button
              key={name}
              width="full"
              isDisabled={name === "Twitter" || name === "GitHub"}
              onClick={handleSignInWithGoogle}
            >
              <VisuallyHidden>Sign in with {name}</VisuallyHidden>
              {icon}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>
    </Box>
  );
}

export default SocialLogin;

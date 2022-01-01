import {
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
// import { Logo } from "./Logo";

import { ButtonGroup, VisuallyHidden } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { createIcon } from "@chakra-ui/react";
import ThemeToggler from "../components/ThemeToggler";
import { userContext } from "../contexts/userContext";

export const GoogleIcon = createIcon({
  displayName: "GoogleIcon",
  path: (
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path
        fill="#4285F4"
        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
      />
      <path
        fill="#34A853"
        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
      />
      <path
        fill="#FBBC05"
        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
      />
      <path
        fill="#EA4335"
        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
      />
    </g>
  ),
});

export const GitHubIcon = createIcon({
  displayName: "GitHubIcon",
  path: (
    <path
      fill="currentColor"
      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
    />
  ),
});

export const TwitterIcon = createIcon({
  displayName: "TwitterIcon",
  path: (
    <path
      fill="#03A9F4"
      d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
    />
  ),
});

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

export const LoginPage = () => {
  const {
    user,
    loading,
    signInWithGoogle,
    registerWithEmailAndPassword,
    logInWithEmailAndPassword,
  } = useContext(userContext);

  const router = useRouter();
  useEffect(() => {
    if (Object.keys(user).length) {
      router.push("/setup-profile");
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [isPassword2Valid, setIsPassword2Valid] = useState(true);
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const passwordRegex = /^\S{8,24}$/;

  const handleOnEmailChange = (e) => {
    const email = e.target.value;
    setEmail(email);
    if (emailRegex.test(email)) {
      setIsEmailValid(true);
    } else {
      setIsEmailValid(false);
    }
  };
  const handleOnPasswordChange = (e) => {
    const password = e.target.value;
    setPassword(password);
    if (passwordRegex.test(password)) {
      setIsPasswordValid(true);
    } else {
      setIsPasswordValid(false);
    }
  };
  const handleOnPassword2Change = (e) => {
    const password2 = e.target.value;
    setPassword2(password2);
    if (passwordRegex.test(password2) && password2 === password) {
      setIsPassword2Valid(true);
    } else {
      setIsPassword2Valid(false);
    }
  };

  const onLoginBtnClicked = async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        const res = await logInWithEmailAndPassword(email, password);
        console.log(res);
      } catch (error) {
        console.log(error);
      }
    }
  };
  const onRegisterBtnClicked = async () => {
    if (isEmailValid && isPasswordValid) {
      try {
        console.log(email, password);
        const res = await registerWithEmailAndPassword(email, password);
        console.log(res);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Container
      maxW="lg"
      py={{ base: "12", md: "24" }}
      px={{ base: "0", sm: "8" }}
    >
      <Stack
        spacing="8"
        boxShadow={{ base: "none", sm: useColorModeValue("md", "md-dark") }}
      >
        <Stack spacing="6">
          <ThemeToggler />
          <Text
            fontSize={"6xl"}
            fontWeight={"extrabold"}
            align="center"
            color={"purple.500"}
          >
            Coding Ducks
          </Text>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>Login</Tab>
              <Tab>Register</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Stack spacing="6">
                  <Stack spacing="5">
                    <FormControl isRequired>
                      <FormLabel htmlFor="login-email">Email</FormLabel>
                      <Input
                        id="login-email"
                        type="email"
                        errorBorderColor="crimson"
                        focusBorderColor={
                          isEmailValid ? "green.500" : "red.500"
                        }
                        isInvalid={!isEmailValid && email != ""}
                        value={email}
                        onChange={handleOnEmailChange}
                      />
                    </FormControl>
                  </Stack>
                  <Stack>
                    <FormControl isRequired>
                      <FormLabel htmlFor="login-password">Password</FormLabel>
                      <Input
                        id="login-password"
                        type="password"
                        errorBorderColor="crimson"
                        focusBorderColor={
                          isPasswordValid ? "green.500" : "red.500"
                        }
                        isInvalid={!isPasswordValid && password !== ""}
                        value={password}
                        onChange={handleOnPasswordChange}
                      />
                    </FormControl>
                  </Stack>
                  <HStack justify="space-between">
                    <Checkbox defaultChecked>Remember me</Checkbox>
                    <Button variant="link" colorScheme="blue" size="sm">
                      Forgot password?
                    </Button>
                  </HStack>
                </Stack>
                <Button
                  mt={10}
                  w="full"
                  colorScheme="purple"
                  onClick={onLoginBtnClicked}
                >
                  Login
                </Button>
              </TabPanel>
              <TabPanel>
                <FormControl isRequired mt={3}>
                  <FormLabel htmlFor="reg-email">Email</FormLabel>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={handleOnEmailChange}
                    errorBorderColor="crimson"
                    focusBorderColor={isEmailValid ? "green.500" : "red.500"}
                    isInvalid={!isEmailValid && email != ""}
                  />
                </FormControl>
                <FormControl isRequired mt={3}>
                  <FormLabel htmlFor="reg-password">Password</FormLabel>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={handleOnPasswordChange}
                    errorBorderColor="crimson"
                    focusBorderColor={isPasswordValid ? "green.500" : "red.500"}
                    isInvalid={!isPasswordValid && password !== ""}
                  />
                </FormControl>
                <FormControl isRequired mt={3}>
                  <FormLabel htmlFor="reg-password2">
                    Confirm password
                  </FormLabel>
                  <Input
                    id="reg-password2"
                    type="password"
                    value={password2}
                    onChange={handleOnPassword2Change}
                    errorBorderColor="crimson"
                    focusBorderColor={
                      isPassword2Valid ? "green.500" : "red.500"
                    }
                    isInvalid={!isPassword2Valid && password2 !== ""}
                  />
                </FormControl>
                <Button
                  mt={10}
                  w="full"
                  colorScheme="purple"
                  onClick={onRegisterBtnClicked}
                >
                  Register
                </Button>
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Divider />
          <Center>
            <Text>Or</Text>
          </Center>
        </Stack>
        <Box
          py={{ base: "0", sm: "8" }}
          px={{ base: "4", sm: "10" }}
          bg={useBreakpointValue({ base: "transparent", sm: "bg-surface" })}
          borderRadius={{ base: "none", sm: "xl" }}
        >
          <Stack spacing="6">
            <ButtonGroup variant="outline" spacing="4" width="full">
              {providers.map(({ name, icon }) => (
                <Button
                  key={name}
                  width="full"
                  disabled={name === "Twitter" || name === "GitHub"}
                  onClick={signInWithGoogle}
                >
                  <VisuallyHidden>Sign in with {name}</VisuallyHidden>
                  {icon}
                </Button>
              ))}
            </ButtonGroup>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};
export default LoginPage;

import {
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";

import { useRouter } from "next/router";

import { userContext } from "../contexts/userContext";
import ForgotPassword from "../_components/ForgotPassword";
import SocialLogin from "../_components/social/SocialLogin";

export const LoginPage = () => {
  const toast = useToast();
  const {
    user,
    firebaseUser,
    registerWithEmailAndPassword,
    logInWithEmailAndPassword,
  } = useContext(userContext);

  const router = useRouter();
  const { from: fromRoute } = router.query;
  useEffect(() => {
    console.log(fromRoute);
    if (firebaseUser) {
      if (fromRoute) router.push("/setup-profile?from=" + fromRoute);
      else router.push(`/setup-profile`);
    }
    if (user) {
      if (fromRoute) {
        router.push("/" + fromRoute);
      } else router.push("/");
    }
  }, [user, fromRoute]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [isPassword2Valid, setIsPassword2Valid] = useState(true);
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const passwordRegex = /^\S{8,24}$/;

  const [logginInProgress, setLogginInProgress] = useState(false);

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
        setLogginInProgress(true);
        const res = await logInWithEmailAndPassword(email, password);
        toast({
          title: `Logged in as $ {user}!`,
          position: "top-right",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
        setLogginInProgress(false);
      } catch (error) {
        console.log(error);
        toast({
          title: "Login failed!",
          description: "User not found.",
          position: "top-right",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        setLogginInProgress(false);
      }
    }
  };
  const onRegisterBtnClicked = async () => {
    if (isEmailValid && isPasswordValid && password == password2) {
      try {
        setLogginInProgress(true);
        const res = await registerWithEmailAndPassword(email, password);
        setLogginInProgress(false);
      } catch (error) {
        toast({
          title: "Registration failed!",
          description: "Couldn't create new user.",
          position: "top-right",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        setLogginInProgress(false);
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
        <SocialLogin />
        <Center>
          <Text>Or</Text>
        </Center>
        <Stack spacing="6">
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onLoginBtnClicked();
                          }
                        }}
                      />
                    </FormControl>
                  </Stack>
                  <HStack justify="space-between">
                    <Checkbox defaultChecked>Remember me</Checkbox>
                    <ForgotPassword />
                  </HStack>
                </Stack>
                <Button
                  mt={10}
                  w="full"
                  colorScheme="purple"
                  onClick={onLoginBtnClicked}
                  isDisabled={!isEmailValid || !isPasswordValid}
                  isLoading={logginInProgress}
                >
                  Login
                </Button>

                {/* <HStack py={"1rem"} justifyContent={"center"}>
                  <Button variant="link" colorScheme="blue" size="sm">
                    Dont have an account?
                  </Button>
                </HStack> */}
              </TabPanel>
              <TabPanel>
                <Stack spacing="6">
                  <Stack spacing="5">
                    <FormControl isRequired>
                      <FormLabel htmlFor="reg-email">Email</FormLabel>
                      <Input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={handleOnEmailChange}
                        errorBorderColor="crimson"
                        focusBorderColor={
                          isEmailValid ? "green.500" : "red.500"
                        }
                        isInvalid={!isEmailValid && email != ""}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="reg-password">Password</FormLabel>
                      <Input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={handleOnPasswordChange}
                        errorBorderColor="crimson"
                        focusBorderColor={
                          isPasswordValid ? "green.500" : "red.500"
                        }
                        isInvalid={!isPasswordValid && password !== ""}
                      />
                    </FormControl>
                    <FormControl isRequired>
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onRegisterBtnClicked();
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      w="full"
                      colorScheme="purple"
                      isDisabled={
                        !isEmailValid ||
                        !isPasswordValid ||
                        password !== password2
                      }
                      onClick={onRegisterBtnClicked}
                      isLoading={logginInProgress}
                    >
                      Register
                    </Button>
                  </Stack>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      </Stack>
    </Container>
  );
};
export default LoginPage;

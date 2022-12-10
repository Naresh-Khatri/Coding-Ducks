import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { SubmissionProvider } from "../contexts/submissionsContext";
import { AuthUserProvider } from "../contexts/userContext";

import MainLayout from "../layout/MainLayout";

import "../styles/globals.css";
import "../styles/split.css";

const colors = {
  brand: {
    900: "#9d4edd",
    800: "#153e75",
    700: "#2a69ac",
  },
  dark: {
    900: "#012244",
    800: "#1a3b5a",
  },
};
const theme = extendTheme({ colors });

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <AuthUserProvider>
        <SubmissionProvider>
          <Component {...pageProps} />
        </SubmissionProvider>
      </AuthUserProvider>
    </ChakraProvider>
  );
}

export default MyApp;

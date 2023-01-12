import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { useContext } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import LoadingContext from "../contexts/loadingContext";
import { SubmissionProvider } from "../contexts/submissionsContext";
import { AuthUserProvider } from "../contexts/userContext";

import {QueryClientProvider, QueryClient} from '@tanstack/react-query'

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

const client = new QueryClient()

function MyApp({ Component, pageProps }) {
  const { isLoading } = useContext(LoadingContext);
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={client}>
      <AuthUserProvider>
        <SubmissionProvider>
          {isLoading && <LoadingOverlay />}
          <LoadingOverlay />
          <Component {...pageProps} />
        </SubmissionProvider>
      </AuthUserProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default MyApp;

import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { useContext, useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import LoadingContext from "../contexts/loadingContext";
import { AuthUserProvider } from "../contexts/userContext";

import {
  QueryClientProvider,
  QueryClient,
  Hydrate,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
const theme = extendTheme({ colors, config: { initialColorMode: "dark" } });

function MyApp({ Component, pageProps }) {
  const { isLoading } = useContext(LoadingContext);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <AuthUserProvider>
            {isLoading && <LoadingOverlay />}
            <LoadingOverlay />
            <Component {...pageProps} />
          </AuthUserProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </Hydrate>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default MyApp;

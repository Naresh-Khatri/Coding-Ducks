// app/providers.jsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { AuthUserProvider } from "../contexts/userContext";
import SplashScreen from "../_components/SplashScreen";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";

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

const pathsWithoutSplash = ["ducklets"];

const matchPath = (restrictedPaths: string[], path: string | null) => {
  if (!path) return false;
  return restrictedPaths.some((restrictedPath) =>
    path.includes(restrictedPath)
  );
};

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathName = usePathname();

  const showSplashScreen =
    process.env.NODE_ENV === "production" &&
    !matchPath(pathsWithoutSplash, pathName);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <AuthUserProvider>
          {showSplashScreen && <SplashScreen />}
          <ChakraProvider theme={theme}>{children}</ChakraProvider>
          <ReactQueryDevtools />
          <Analytics />
        </AuthUserProvider>
      </Suspense>
    </QueryClientProvider>
  );
}

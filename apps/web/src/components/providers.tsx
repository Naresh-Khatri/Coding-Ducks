"use client";

import { TRPCReactProvider } from "~/trpc/react";
import { SignInProvider } from "./sign-in-dialog";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <SignInProvider>{children}</SignInProvider>
      </TRPCReactProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
};

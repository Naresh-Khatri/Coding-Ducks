"use client";

import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Loader2, Terminal } from "lucide-react";

import { authClient } from "~/auth/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { track } from "~/lib/analytics";
import { cn } from "~/lib/utils";

type Provider = "google" | "github";

const LAST_PROVIDER_KEY = "auth:last-provider";

function readLastProvider(): Provider | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LAST_PROVIDER_KEY);
    return v === "google" || v === "github" ? v : null;
  } catch {
    return null;
  }
}

function writeLastProvider(provider: Provider) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // ignore
  }
}

type OpenOptions = {
  source: string;
  callbackURL?: string;
};

type SignInContextValue = {
  openSignIn: (opts: OpenOptions) => void;
};

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn() {
  const ctx = useContext(SignInContext);
  if (!ctx) {
    throw new Error("useSignIn must be used inside <SignInProvider>");
  }
  return ctx;
}

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<OpenOptions>({ source: "unknown" });

  const openSignIn = useCallback((next: OpenOptions) => {
    setOpts(next);
    setOpen(true);
  }, []);

  return (
    <SignInContext.Provider value={{ openSignIn }}>
      {children}
      <SignInDialog
        open={open}
        onOpenChange={setOpen}
        source={opts.source}
        callbackURL={opts.callbackURL}
      />
    </SignInContext.Provider>
  );
}

function SignInDialog({
  open,
  onOpenChange,
  source,
  callbackURL,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  callbackURL?: string;
}) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [lastProvider, setLastProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (open) setLastProvider(readLastProvider());
  }, [open]);

  const handleSignIn = async (provider: Provider) => {
    if (pending) return;
    setPending(provider);
    track("auth-signin", { provider, source });
    writeLastProvider(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL:
          callbackURL ??
          (typeof window !== "undefined"
            ? window.location.pathname
            : undefined),
      });
    } catch {
      setPending(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-5 pt-2 pb-1 text-center">
          <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl">
            <Terminal size={24} strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-xl">
              Welcome to Coding Ducks
            </DialogTitle>
            <DialogDescription>
              Sign in to save progress, submit solutions, and join ducklets.
            </DialogDescription>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2.5">
            <ProviderButton
              provider="google"
              pending={pending}
              isLast={lastProvider === "google"}
              onClick={() => handleSignIn("google")}
            />
            <ProviderButton
              provider="github"
              pending={pending}
              isLast={lastProvider === "github"}
              onClick={() => handleSignIn("github")}
            />
          </div>

          <p className="text-muted-foreground mt-1 text-xs">
            By continuing you agree to our Terms and acknowledge our Privacy
            Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProviderButton({
  provider,
  pending,
  isLast,
  onClick,
}: {
  provider: Provider;
  pending: Provider | null;
  isLast: boolean;
  onClick: () => void;
}) {
  const isPending = pending === provider;
  const disabled = pending !== null;
  const label = provider === "google" ? "Continue with Google" : "Continue with GitHub";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "border-border bg-background hover:bg-accent hover:text-accent-foreground relative flex h-11 w-full items-center justify-center gap-3 rounded-md border px-4 text-sm font-medium shadow-xs transition-colors",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isLast && "border-primary/40 ring-primary/15 ring-1",
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : provider === "google" ? (
          <GoogleIcon />
        ) : (
          <GitHubIcon />
        )}
      </span>
      <span>{label}</span>
      {isLast && (
        <span
          aria-label="Last used"
          className="bg-primary text-primary-foreground absolute -top-2 right-3 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase shadow-sm"
        >
          Last
        </span>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.67 5.57.67 11.84c0 5.01 3.24 9.26 7.74 10.76.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.15.68-3.81-1.52-3.81-1.52-.52-1.31-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.74.4-1.24.72-1.53-2.51-.29-5.16-1.26-5.16-5.59 0-1.24.44-2.25 1.16-3.04-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.16.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.15-1.46 3.1-1.16 3.1-1.16.62 1.55.23 2.69.11 2.98.72.79 1.16 1.8 1.16 3.04 0 4.35-2.65 5.3-5.18 5.58.41.36.77 1.06.77 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.66.79.55 4.5-1.5 7.73-5.75 7.73-10.76C23.33 5.57 18.27.5 12 .5Z" />
    </svg>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { authClient } from "~/auth/client";
import { Button } from "~/components/ui/button";
import { track } from "~/lib/analytics";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  if (!session) {
    return (
      <Button
        size="lg"
        onClick={async () => {
          track("auth-signin", { provider: "google", source: "hero" });
          authClient.signIn.social({ provider: "google" });
        }}
      >
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button
        size="lg"
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

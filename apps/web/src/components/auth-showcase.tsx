"use client";

import { useRouter } from "next/navigation";

import { authClient } from "~/auth/client";
import { useSignIn } from "~/components/sign-in-dialog";
import { Button } from "~/components/ui/button";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { openSignIn } = useSignIn();

  if (!session) {
    return (
      <Button
        size="lg"
        onClick={() => openSignIn({ source: "hero", callbackURL: "/problems" })}
      >
        Get started
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

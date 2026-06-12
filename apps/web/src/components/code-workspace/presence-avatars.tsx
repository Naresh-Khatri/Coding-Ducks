"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";
import type { PresenceUser } from "~/lib/webcontainer/use-file-presence";

/** A compact, overlapping stack of collaborator avatars for a file row/tab. */
export function PresenceAvatars({
  users,
  max = 3,
  size = 16,
  className,
}: {
  users: PresenceUser[];
  max?: number;
  size?: number;
  className?: string;
}) {
  if (users.length === 0) return null;
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {shown.map((user) => (
        <Avatar
          key={user.id}
          title={user.name}
          className="border-background border ring-1"
          style={{
            width: size,
            height: size,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--tw-ring-color" as any]: user.color ?? "transparent",
          }}
        >
          <AvatarImage src={user.photoURL} />
          <AvatarFallback className="text-[8px]">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <div
          className="bg-muted text-muted-foreground border-background flex items-center justify-center rounded-full border text-[8px] font-medium"
          style={{ width: size, height: size }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

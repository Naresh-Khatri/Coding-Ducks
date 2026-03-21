"use client";

import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Pencil,
  Twitter,
} from "lucide-react";

import { authClient } from "~/auth/client";
import { getAvatarUrl } from "~/lib/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { AvatarPicker } from "./avatar-picker";
import { EditProfileDialog } from "./edit-profile-dialog";

interface ProfileHeaderProps {
  profile: {
    userId: string;
    username: string;
    fullname: string | null;
    name: string;
    bio: string | null;
    image: string | null;
    photoURL: string | null;
    avatarSeed: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
    createdAt: Date | null;
  };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = authClient.useSession();
  const isOwnProfile = session?.user?.id === profile.userId;
  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const displayName = profile.fullname || profile.name;
  const avatarUrl = getAvatarUrl(profile.avatarSeed ?? profile.username);
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const socialLinks = [
    { url: profile.githubUrl, icon: Github, label: "GitHub" },
    { url: profile.twitterUrl, icon: Twitter, label: "Twitter" },
    {
      url: profile.linkedinUrl,
      icon: ExternalLink,
      label: "LinkedIn",
    },
    { url: profile.websiteUrl, icon: Globe, label: "Website" },
  ].filter((l) => l.url);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={displayName}
          className="bg-muted h-24 w-24 rounded-2xl shadow-lg"
        />
        {isOwnProfile && (
          <button
            onClick={() => setAvatarOpen(true)}
            className="bg-background border-border hover:bg-muted absolute -right-1 -bottom-1 rounded-full border p-1.5 shadow-sm transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <span className="text-muted-foreground text-lg">
            @{profile.username}
          </span>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          )}
        </div>

        {profile.bio && (
          <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          {joinDate && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              Joined {joinDate}
            </span>
          )}
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors",
              )}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {isOwnProfile && (
        <>
          <EditProfileDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            profile={profile}
          />
          <AvatarPicker
            open={avatarOpen}
            onOpenChange={setAvatarOpen}
            currentSeed={profile.avatarSeed ?? profile.username}
          />
        </>
      )}
    </div>
  );
}

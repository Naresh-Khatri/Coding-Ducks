"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    username: string;
    fullname: string | null;
    bio: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  };
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
}: EditProfileDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [form, setForm] = useState({
    fullname: profile.fullname ?? "",
    bio: profile.bio ?? "",
    githubUrl: profile.githubUrl ?? "",
    twitterUrl: profile.twitterUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
  });

  const [username, setUsername] = useState(profile.username);
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const usernameChanged = username !== profile.username;
  const usernameValid = /^[a-z0-9_]{3,30}$/.test(username);

  // Debounce username for availability check
  useEffect(() => {
    if (!usernameChanged || !usernameValid) {
      setDebouncedUsername("");
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [username, usernameChanged, usernameValid]);

  const { data: availability, isFetching: isChecking } = useQuery(
    trpc.profile.checkUsername.queryOptions(
      { username: debouncedUsername },
      { enabled: !!debouncedUsername },
    ),
  );

  const usernameAvailable =
    debouncedUsername === username ? availability?.available : undefined;

  const profileMutation = useMutation(
    trpc.profile.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["profile"]] });
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update profile");
      },
    }),
  );

  const usernameMutation = useMutation(
    trpc.profile.updateUsername.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [["profile"]] });
        router.replace(`/u/${data.username}`);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update username");
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameChanged) {
      if (!usernameValid || usernameAvailable === false) return;
      usernameMutation.mutate({ username });
    }

    profileMutation.mutate({
      fullname: form.fullname || undefined,
      bio: form.bio || undefined,
      githubUrl: form.githubUrl || undefined,
      twitterUrl: form.twitterUrl || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      websiteUrl: form.websiteUrl || undefined,
    });

    if (!usernameChanged) {
      toast.success("Profile updated");
      onOpenChange(false);
    }
  };

  const isPending = profileMutation.isPending || usernameMutation.isPending;
  const canSubmit =
    !isPending &&
    (!usernameChanged || (usernameValid && usernameAvailable === true));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                placeholder="username"
                maxLength={30}
                className={cn(
                  "pr-8",
                  usernameChanged &&
                    usernameValid &&
                    usernameAvailable === true &&
                    "border-green-500 focus-visible:ring-green-500",
                  usernameChanged &&
                    usernameValid &&
                    usernameAvailable === false &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {usernameChanged && usernameValid && (
                <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                  {isChecking || debouncedUsername !== username ? (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  ) : usernameAvailable ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {usernameChanged && !usernameValid && username.length > 0 && (
              <p className="text-destructive text-xs">
                3-30 characters, lowercase letters, numbers, and underscores
                only
              </p>
            )}
            {usernameChanged &&
              usernameValid &&
              usernameAvailable === false && (
                <p className="text-destructive text-xs">
                  Username already taken
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              value={form.fullname}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullname: e.target.value }))
              }
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              value={form.githubUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, githubUrl: e.target.value }))
              }
              placeholder="https://github.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter URL</Label>
            <Input
              id="twitterUrl"
              value={form.twitterUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, twitterUrl: e.target.value }))
              }
              placeholder="https://twitter.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              value={form.linkedinUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, linkedinUrl: e.target.value }))
              }
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              value={form.websiteUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, websiteUrl: e.target.value }))
              }
              placeholder="https://your-website.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

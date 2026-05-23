"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Laptop,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useTRPC } from "~/trpc/react";

export default function SettingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch initial data
  const { data: profile } = useSuspenseQuery(
    trpc.user.getProfile.queryOptions(),
  );

  const { data: sessions } = useSuspenseQuery(
    trpc.user.getSessions.queryOptions(),
  );

  // Local state for forms
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.emailNotifications ?? true,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Mutations
  const updateProfileMutation = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        void queryClient.invalidateQueries(trpc.user.getProfile.pathFilter());
      },
      onError: () => toast.error("Failed to update profile"),
    }),
  );

  const updatePreferencesMutation = useMutation(
    trpc.user.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Preferences updated successfully");
        void queryClient.invalidateQueries(trpc.user.getProfile.pathFilter());
      },
      onError: () => toast.error("Failed to update preferences"),
    }),
  );

  const revokeSessionMutation = useMutation(
    trpc.user.revokeSession.mutationOptions({
      onSuccess: () => {
        toast.success("Session revoked");
        void queryClient.invalidateQueries(trpc.user.getSessions.pathFilter());
      },
      onError: () => toast.error("Failed to revoke session"),
    }),
  );

  const revokeAllSessionsMutation = useMutation(
    trpc.user.revokeAllSessions.mutationOptions({
      onSuccess: () => {
        toast.success("All other sessions revoked");
        void queryClient.invalidateQueries(trpc.user.getSessions.pathFilter());
      },
      onError: () => toast.error("Failed to revoke sessions"),
    }),
  );

  const deleteAccountMutation = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: () => {
        toast.success("Account deleted");
        window.location.href = "/";
      },
      onError: () => toast.error("Failed to delete account"),
    }),
  );

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email });
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      emailNotifications,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="text-primary h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and public profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <p className="text-muted-foreground text-[0.8rem]">
                  This is the email you use to log in.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              <CardTitle>Account Security</CardTitle>
            </div>
            <CardDescription>
              Manage your active sessions and security preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-4 text-sm font-medium">Active Sessions</h4>
              <div className="rounded-md border">
                <div className="divide-y">
                  {sessions?.map((session) => (
                    <div
                      key={session.token}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                          {session.userAgent
                            ?.toLowerCase()
                            .includes("mobile") ? (
                            <Smartphone className="h-5 w-5 opacity-60" />
                          ) : (
                            <Laptop className="h-5 w-5 opacity-60" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {session.userAgent || "Unknown Device"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {session.ipAddress || "Unknown IP"} •{" "}
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          revokeSessionMutation.mutate({ token: session.token })
                        }
                        disabled={revokeSessionMutation.isPending}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                    <div className="text-muted-foreground p-4 text-center text-sm">
                      No other active sessions found.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => revokeAllSessionsMutation.mutate()}
                  disabled={revokeAllSessionsMutation.isPending}
                >
                  Revoke All Other Sessions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="pb-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="text-primary h-5 w-5" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your dashboard experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-muted-foreground text-sm">
                  Receive emails about your account activity and usage alerts.
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t px-6 py-4">
            <Button
              onClick={handleSavePreferences}
              disabled={updatePreferencesMutation.isPending}
            >
              Save Preferences
            </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <div className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="text-destructive font-medium">Delete Account</h4>
                <p className="text-destructive/80 text-sm">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="confirm">
                      Type <span className="font-bold">delete my account</span>{" "}
                      to confirm
                    </Label>
                    <Input
                      id="confirm"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setDeleteConfirmation("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteConfirmation !== "delete my account"}
                      onClick={() => deleteAccountMutation.mutate()}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

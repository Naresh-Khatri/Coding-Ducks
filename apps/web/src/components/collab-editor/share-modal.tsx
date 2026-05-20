"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Plus, Shield, ShieldAlert, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { useTRPC } from "~/trpc/react";

interface ShareModalProps {
  duckletId: number;

  isOwner: boolean;
  isPublic: boolean;
}

export function ShareModal({
  duckletId,
  isOwner,
  isPublic,
}: ShareModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isOpen, setIsOpen] = useState(false);

  // Queries
  const { data: ducklet, isLoading } = useQuery(
    trpc.ducklet.byId.queryOptions({ id: duckletId }, { enabled: isOpen })
  );

  // Mutations
  const inviteMutation = useMutation(trpc.ducklet.inviteUser.mutationOptions({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setInviteUsername("");
      queryClient.invalidateQueries(trpc.ducklet.byId.queryFilter({ id: duckletId }));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  }));

  const removeMemberMutation = useMutation(trpc.ducklet.removeMember.mutationOptions({
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries(trpc.ducklet.byId.queryFilter({ id: duckletId }));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  }));

  const respondRequestMutation = useMutation(trpc.ducklet.respondToRequest.mutationOptions({
    onSuccess: (data, variables) => {
      toast.success(variables.accept ? "Request approved" : "Request denied");
      queryClient.invalidateQueries(trpc.ducklet.byId.queryFilter({ id: duckletId }));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  }));

  const updateDuckletMutation = useMutation(trpc.ducklet.update.mutationOptions({
    onSuccess: (data) => {
      if (!data) return;
      toast.success(`Ducklet is now ${data.isPublic ? "Public" : "Private"}`);
      const queryKey = trpc.ducklet.byId.queryKey({ id: duckletId });
      queryClient.setQueryData(queryKey, (prev) =>
        prev ? { ...prev, isPublic: data.isPublic } : prev,
      );
      queryClient.invalidateQueries(trpc.ducklet.byId.queryFilter({ id: duckletId }));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  }));

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    inviteMutation.mutate({
      duckletId,
      username: inviteUsername,
      role: inviteRole,
    });
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const pendingRequests = ducklet?.members.filter(m => m.status === "requested") || [];
  const activeMembers = ducklet?.members.filter(m => m.status === "active" || m.status === "invited") || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Share
          {pendingRequests.length > 0 && isOwner && (
            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Ducklet</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on this ducklet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              id="link"
              defaultValue={typeof window !== "undefined" ? window.location.href : ""}
              readOnly
              className="h-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={copyLink}>
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex flex-col">
              <span className="text-sm font-medium">General Access</span>
              <span className="text-xs text-muted-foreground">
                {isPublic ? "Anyone with the link can view" : "Only invited members can access"}
              </span>
            </div>
            <Select
              value={isPublic ? "public" : "private"}
              onValueChange={(val) => updateDuckletMutation.mutate({ id: duckletId, isPublic: val === "public" })}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="invite" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="members">
              Members
              {pendingRequests.length > 0 && isOwner && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4 pt-2">
            {isOwner ? (
              <form onSubmit={handleInvite} className="flex items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Input
                    placeholder="Enter username"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="h-8"
                  />
                </div>
                <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Only the owner can invite new members.
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="pt-2">
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {/* Pending Requests */}
                {isOwner && pendingRequests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Pending Requests</h4>
                    <div className="space-y-2">
                      {pendingRequests.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.photoURL ?? undefined} />
                              <AvatarFallback>{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{member.username}</span>
                              <span className="text-[10px] text-muted-foreground">Requested access</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={() => respondRequestMutation.mutate({ duckletId, userId: member.userId, accept: true, role: "editor" })}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => respondRequestMutation.mutate({ duckletId, userId: member.userId, accept: false })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Members */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ducklet?.owner?.photoURL ?? undefined} />
                        <AvatarFallback>{ducklet?.owner?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{ducklet?.owner?.username}</p>
                        <p className="text-xs text-muted-foreground">Owner</p>
                      </div>
                    </div>
                  </div>

                  {activeMembers.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photoURL ?? undefined} />
                          <AvatarFallback>{member.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {member.username}
                            {member.status === "invited" && <Badge variant="outline" className="ml-2 text-[10px] h-4 py-0">Invited</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => removeMemberMutation.mutate({ duckletId, userId: member.userId })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

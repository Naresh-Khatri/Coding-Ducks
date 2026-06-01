"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
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
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useDebounce } from "~/hooks/use-debounce";
import { track } from "~/lib/analytics";
import { useTRPC } from "~/trpc/react";

interface ShareModalProps {
  duckletId: number;

  isOwner: boolean;
  isPublic: boolean;
}

export function ShareModal({ duckletId, isOwner, isPublic }: ShareModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [isOpen, setIsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const debouncedInviteUsername = useDebounce(inviteUsername.trim(), 200);

  // Queries
  const { data: ducklet } = useQuery(
    trpc.ducklet.byId.queryOptions({ id: duckletId }, { enabled: isOpen }),
  );

  const memberUserIds = useMemo(
    () => new Set(ducklet?.members.map((m) => m.userId) ?? []),
    [ducklet?.members],
  );
  const ownerId = ducklet?.ownerId;

  const canSearch = debouncedInviteUsername.length >= 2;
  const { data: searchResults, isFetching: isSearching } = useQuery(
    trpc.profile.search.queryOptions(
      { query: debouncedInviteUsername },
      {
        enabled: isOpen && isOwner && canSearch,
        staleTime: 30_000,
      },
    ),
  );

  const filteredResults = useMemo(
    () =>
      (searchResults ?? []).filter(
        (u) => u.userId !== ownerId && !memberUserIds.has(u.userId),
      ),
    [searchResults, memberUserIds, ownerId],
  );

  // Mutations
  const inviteMutation = useMutation(
    trpc.ducklet.inviteUser.mutationOptions({
      onSuccess: (_, variables) => {
        track("ducklet-invite", { id: duckletId, role: variables.role });
        toast.success("Invitation sent successfully");
        setInviteUsername("");
        setIsSuggestionsOpen(false);
        queryClient.invalidateQueries(
          trpc.ducklet.byId.queryFilter({ id: duckletId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const removeMemberMutation = useMutation(
    trpc.ducklet.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed");
        queryClient.invalidateQueries(
          trpc.ducklet.byId.queryFilter({ id: duckletId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const updateMemberRoleMutation = useMutation(
    trpc.ducklet.updateMemberRole.mutationOptions({
      onSuccess: () => {
        toast.success("Role updated");
        queryClient.invalidateQueries(
          trpc.ducklet.byId.queryFilter({ id: duckletId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const respondRequestMutation = useMutation(
    trpc.ducklet.respondToRequest.mutationOptions({
      onSuccess: (data, variables) => {
        track("ducklet-respond-request", {
          id: duckletId,
          accept: variables.accept,
        });
        toast.success(variables.accept ? "Request approved" : "Request denied");
        queryClient.invalidateQueries(
          trpc.ducklet.byId.queryFilter({ id: duckletId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  const updateDuckletMutation = useMutation(
    trpc.ducklet.update.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        track("ducklet-visibility-change", {
          id: duckletId,
          isPublic: data.isPublic,
        });
        toast.success(`Ducklet is now ${data.isPublic ? "Public" : "Private"}`);
        const queryKey = trpc.ducklet.byId.queryKey({ id: duckletId });
        queryClient.setQueryData(queryKey, (prev) =>
          prev ? { ...prev, isPublic: data.isPublic } : prev,
        );
        queryClient.invalidateQueries(
          trpc.ducklet.byId.queryFilter({ id: duckletId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

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

  const pendingRequests =
    ducklet?.members.filter((m) => m.status === "requested") || [];
  const activeMembers =
    ducklet?.members.filter(
      (m) => m.status === "active" || m.status === "invited",
    ) || [];

  const membersList = (
    <ScrollArea className="h-[200px] pr-4">
      <div className="space-y-4">
        {/* Pending Requests */}
        {isOwner && pendingRequests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
              Pending Requests
            </h4>
            <div className="space-y-2">
              {pendingRequests.map((member) => (
                <div
                  key={member.userId}
                  className="bg-muted/30 flex items-center justify-between rounded-md p-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.photoURL ?? undefined} />
                      <AvatarFallback>
                        {member.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.username}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        Requested access
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Approve ${member.username}`}
                      className="h-6 w-6 text-green-500 hover:bg-green-500/10 hover:text-green-600"
                      onClick={() =>
                        respondRequestMutation.mutate({
                          duckletId,
                          userId: member.userId,
                          accept: true,
                          role: "editor",
                        })
                      }
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Deny ${member.username}`}
                      className="h-6 w-6 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                      onClick={() =>
                        respondRequestMutation.mutate({
                          duckletId,
                          userId: member.userId,
                          accept: false,
                        })
                      }
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
                <AvatarFallback>
                  {ducklet?.owner?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm leading-none font-medium">
                  {ducklet?.owner?.username}
                </p>
                <p className="text-muted-foreground text-xs">Owner</p>
              </div>
            </div>
          </div>

          {activeMembers.map((member) => (
            <div
              key={member.userId}
              className="group flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.photoURL ?? undefined} />
                  <AvatarFallback>
                    {member.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm leading-none font-medium">
                    {member.username}
                    {member.status === "invited" && (
                      <Badge
                        variant="outline"
                        className="ml-2 h-4 py-0 text-[10px]"
                      >
                        Invited
                      </Badge>
                    )}
                  </p>
                  {!isOwner && (
                    <p className="text-muted-foreground text-xs capitalize">
                      {member.role}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isOwner ? (
                  <Select
                    value={member.role}
                    onValueChange={(val) =>
                      updateMemberRoleMutation.mutate({
                        duckletId,
                        userId: member.userId,
                        role: val as "editor" | "viewer",
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-[90px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${member.username}`}
                    className="text-muted-foreground hover:text-destructive h-7 w-7"
                    onClick={() =>
                      removeMemberMutation.mutate({
                        duckletId,
                        userId: member.userId,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Share
          {pendingRequests.length > 0 && isOwner && (
            <Badge
              variant="destructive"
              className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
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
              defaultValue={
                typeof window !== "undefined" ? window.location.href : ""
              }
              readOnly
              className="h-8 text-xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-3"
            onClick={copyLink}
            aria-label="Copy ducklet link"
          >
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between border-b py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">General Access</span>
              <span className="text-muted-foreground text-xs">
                {isPublic
                  ? "Anyone with the link can view"
                  : "Only invited members can access"}
              </span>
            </div>
            <Select
              value={isPublic ? "public" : "private"}
              onValueChange={(val) =>
                updateDuckletMutation.mutate({
                  id: duckletId,
                  isPublic: val === "public",
                })
              }
            >
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isOwner ? (
          <Tabs defaultValue="invite" className="mt-2 w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">Invite</TabsTrigger>
              <TabsTrigger value="members">
                Members
                {pendingRequests.length > 0 && isOwner && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-4 px-1 text-[10px]"
                  >
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="space-y-4 pt-2">
              <form onSubmit={handleInvite} className="flex items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Popover
                    open={isSuggestionsOpen && canSearch}
                    onOpenChange={setIsSuggestionsOpen}
                  >
                    <PopoverAnchor asChild>
                      <Input
                        placeholder="Search by username, name, or email"
                        value={inviteUsername}
                        onChange={(e) => {
                          setInviteUsername(e.target.value);
                          setIsSuggestionsOpen(true);
                        }}
                        onFocus={() => setIsSuggestionsOpen(true)}
                        autoComplete="off"
                        className="h-8"
                      />
                    </PopoverAnchor>
                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      className="w-(--radix-popover-trigger-width) p-1"
                    >
                      {isSearching ? (
                        <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Searching…
                        </div>
                      ) : filteredResults.length === 0 ? (
                        <div className="text-muted-foreground px-2 py-3 text-center text-xs">
                          No users match &ldquo;{debouncedInviteUsername}&rdquo;
                        </div>
                      ) : (
                        <ul className="max-h-56 overflow-y-auto">
                          {filteredResults.map((u) => (
                            <li key={u.userId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setInviteUsername(u.username);
                                  setIsSuggestionsOpen(false);
                                }}
                                className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left"
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={u.photoURL ?? undefined} />
                                  <AvatarFallback>
                                    {u.username[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-sm font-medium">
                                    {u.fullname ?? u.username}
                                  </span>
                                  <span className="text-muted-foreground truncate text-xs">
                                    @{u.username}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <Select
                  value={inviteRole}
                  onValueChange={(val) =>
                    setInviteRole(val as "editor" | "viewer")
                  }
                >
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  size="sm"
                  disabled={inviteMutation.isPending || !inviteUsername.trim()}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Invite"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="members" className="pt-2">
              {membersList}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-2 w-full">{membersList}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

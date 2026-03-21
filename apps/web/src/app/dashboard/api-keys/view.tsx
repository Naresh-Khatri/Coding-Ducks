"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Copy,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

export default function ApiKeysView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: keys } = useSuspenseQuery(trpc.apiKey.list.queryOptions());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const createKeyMutation = useMutation(
    trpc.apiKey.create.mutationOptions({
      onSuccess: async (data) => {
        setNewKeyName("");
        setIsCreateModalOpen(false);
        setNewlyCreatedKey(data.key);
        await queryClient.invalidateQueries(trpc.apiKey.pathFilter());
        toast("API key created successfully!");
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to create API keys"
            : "Failed to create API key",
        );
      },
    }),
  );

  const revokeKeyMutation = useMutation(
    trpc.apiKey.revoke.mutationOptions({
      onSuccess: async () => {
        setRevokeKeyId(null);
        await queryClient.invalidateQueries(trpc.apiKey.pathFilter());
        toast.success("API key revoked successfully");
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to revoke API keys"
            : "Failed to revoke API key",
        );
      },
    }),
  );

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    createKeyMutation.mutate({ name: newKeyName });
  };

  const handleRevokeKey = (id: string) => {
    revokeKeyMutation.mutate({ id });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const formatLastUsed = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const lastUsed = new Date(date);
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return formatDate(date);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="mb-1 text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground text-sm">
            Manage the keys used to authenticate your requests.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-lg"
        >
          <Plus size={18} />
          Create New Key
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card flex w-full gap-3 self-start rounded-xl border p-2 md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Filter keys..."
            className="bg-muted/50 w-full border-none pl-10"
          />
        </div>
        <Button variant="ghost" size="icon">
          <RefreshCw size={18} />
        </Button>
      </div>

      {/* Keys Table */}
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b text-xs font-medium tracking-wider uppercase">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Token</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Last Used</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {keys.map((key) => (
                <tr
                  key={key.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                      {key.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-muted-foreground bg-muted flex w-fit items-center gap-2 rounded-md border px-2 py-1 font-mono text-sm">
                      {key.prefix}
                      <button
                        onClick={() => copyToClipboard(key.prefix, key.id)}
                        className="text-muted-foreground hover:text-foreground ml-2 transition-colors"
                      >
                        {copiedId === key.id ? (
                          <span className="text-xs text-emerald-500">
                            Copied
                          </span>
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {formatDate(key.createdAt)}
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {formatLastUsed(key.lastUsedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        key.status === "active"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 dark:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {key.status === "active" ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                      {key.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRevokeKeyId(key.id)}
                          className="text-muted-foreground hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Key Created Dialog */}
      <Dialog
        open={!!newlyCreatedKey}
        onOpenChange={() => setNewlyCreatedKey(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully!</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it
              again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Your API Key</Label>
              <div className="bg-muted mt-2 flex items-center gap-2 rounded-md border p-3">
                <code className="text-foreground flex-1 font-mono text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    newlyCreatedKey &&
                    copyToClipboard(newlyCreatedKey, "new-key")
                  }
                >
                  {copiedId === "new-key" ? (
                    <span className="text-xs text-emerald-500">✓</span>
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-600 dark:text-amber-500">
                ⚠️ This is the only time you'll see the full key. Store it
                securely!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>
              I've copied my key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Key Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Enter a name for this key to identify its usage later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateKey}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  autoFocus
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline"
                  disabled={createKeyMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createKeyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
              >
                {createKeyMutation.isPending ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation */}
      <AlertDialog
        open={!!revokeKeyId}
        onOpenChange={() => setRevokeKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the API key. Any applications using this key will
              no longer be able to authenticate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeKeyId && handleRevokeKey(revokeKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

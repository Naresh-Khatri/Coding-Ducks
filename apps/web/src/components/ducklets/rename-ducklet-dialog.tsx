"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
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
import { useTRPC } from "~/trpc/react";

interface RenameDuckletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  currentName: string;
}

export function RenameDuckletDialog({
  open,
  onOpenChange,
  roomId,
  currentName,
}: RenameDuckletDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // Reset name to currentName each time the dialog opens using the prev-prop
  // pattern so it runs synchronously during render without an extra effect commit.
  // name is an editable copy of the currentName prop that the user can change
  const [name, setName] = useState(currentName);
  // prevOpen is read during render for the prev-prop comparison below
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setName(currentName);
  }

  const renameMutation = useMutation(
    trpc.room.update.mutationOptions({
      onSuccess: (data) => {
        if (!data) return;
        toast.success("Ducklet renamed");

        const byIdKey = trpc.room.byId.queryKey({ id: roomId });
        queryClient.setQueryData(byIdKey, (prev) =>
          prev ? { ...prev, name: data.name } : prev,
        );
        void queryClient.invalidateQueries(
          trpc.room.byId.queryFilter({ id: roomId }),
        );
        void queryClient.invalidateQueries(
          trpc.room.list.infiniteQueryFilter(),
        );
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onOpenChange(false);
      return;
    }
    renameMutation.mutate({ id: roomId, name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Ducklet</DialogTitle>
            <DialogDescription>
              Give your ducklet a clearer name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="ducklet-name">Name</Label>
            <Input
              id="ducklet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={renameMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renameMutation.isPending || !name.trim()}
            >
              {renameMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

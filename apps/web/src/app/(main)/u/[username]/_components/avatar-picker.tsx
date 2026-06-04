"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { getAvatarUrl } from "~/lib/avatar";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

const PRESET_SEEDS = [
  "felix",
  "aneka",
  "milo",
  "sophia",
  "luna",
  "oliver",
  "cleo",
  "jasper",
  "nova",
  "atlas",
  "iris",
  "orion",
  "sage",
  "piper",
  "finn",
  "maple",
  "echo",
  "willow",
];

function generateRandomSeeds(count: number): string[] {
  const seeds: string[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push(`rand_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  }
  return seeds;
}

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeed: string;
}

export function AvatarPicker({
  open,
  onOpenChange,
  currentSeed,
}: AvatarPickerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // selected is an editable copy of the currentSeed prop — it diverges once the user picks a new avatar
  // react-doctor-disable-next-line react-doctor/no-derived-useState
  const [selected, setSelected] = useState(currentSeed);
  // prevSeed is the prev-prop tracking state used during render for the comparison below — not a render-only side-effect
  // react-doctor-disable-next-line react-doctor/no-derived-useState
  // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [prevSeed, setPrevSeed] = useState(currentSeed);
  const [extraSeeds, setExtraSeeds] = useState<string[]>([]);

  // Sync selected avatar when currentSeed prop changes (prev-prop pattern)
  if (currentSeed !== prevSeed) {
    setPrevSeed(currentSeed);
    setSelected(currentSeed);
  }

  const allSeeds = [...PRESET_SEEDS, ...extraSeeds];

  const mutation = useMutation(
    trpc.profile.updateAvatar.mutationOptions({
      onSuccess: () => {
        toast.success("Avatar updated");
        queryClient.invalidateQueries({ queryKey: [["profile"]] });
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update avatar");
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose Avatar</DialogTitle>
        </DialogHeader>

        {/* Current preview */}
        <div className="flex items-center justify-center py-2">
          <Image
            src={getAvatarUrl(selected, 160)}
            alt="Selected avatar"
            width={160}
            height={160}
            className="bg-muted size-28 rounded-2xl shadow-md"
          />
        </div>

        {/* Grid of presets */}
        <div className="grid grid-cols-6 gap-2">
          {allSeeds.map((seed) => (
            <button type="button"
              key={seed}
              onClick={() => setSelected(seed)}
              className={cn(
                "rounded-xl border-2 p-1 transition-all hover:scale-105",
                selected === seed
                  ? "border-primary ring-primary/20 ring-2"
                  : "hover:border-border border-transparent",
              )}
            >
              <Image
                src={getAvatarUrl(seed, 80)}
                alt={seed}
                width={80}
                height={80}
                className="bg-muted h-full w-full rounded-lg"
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExtraSeeds(generateRandomSeeds(6))}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            More options
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate({ seed: selected })}
              disabled={mutation.isPending || selected === currentSeed}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

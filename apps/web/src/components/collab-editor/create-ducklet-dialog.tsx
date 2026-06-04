"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Atom,
  Braces,
  FileCode2,
  FileType2,
  Flame,
  Hexagon,
  Loader2,
  Server,
} from "lucide-react";
import * as Y from "yjs";

import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  seedFiles,
  TEMPLATES,
} from "@acme/ducklet-fs";

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
import { track } from "~/lib/analytics";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

// Per-template glyph + accent, StackBlitz-style. Kept in the UI layer so the
// shared `@acme/ducklet-fs` catalogue stays presentation-agnostic.
const TEMPLATE_VISUALS: Record<
  string,
  { icon: ComponentType<{ className?: string }>; className: string }
> = {
  static: { icon: FileCode2, className: "text-amber-500" },
  vanilla: { icon: Braces, className: "text-yellow-500" },
  "vanilla-ts": { icon: FileType2, className: "text-blue-500" },
  react: { icon: Atom, className: "text-cyan-500" },
  "react-ts": { icon: Atom, className: "text-sky-500" },
  vue: { icon: Hexagon, className: "text-emerald-500" },
  svelte: { icon: Flame, className: "text-orange-500" },
  node: { icon: Server, className: "text-green-600" },
};

// Browser-safe base64 encoding for the initial Y.js snapshot (no Node Buffer).
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function CreateDuckletDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);

  const createMutation = useMutation(
    trpc.ducklet.create.mutationOptions({
      onSuccess: (ducklet) => {
        if (!ducklet) return;
        track("ducklet-create", { id: ducklet.id, template: templateId });
        void queryClient.invalidateQueries(
          trpc.ducklet.list.infiniteQueryFilter(),
        );
        onOpenChange(false);
        setName("");
        router.push(`/ducklets/${ducklet.id}`);
      },
    }),
  );

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const template = getTemplate(templateId) ?? getTemplate(DEFAULT_TEMPLATE_ID);
    if (!template) return;

    // Seed a fresh Y.Doc with the template's files, then ship the encoded
    // snapshot so the room opens pre-populated (and the file-tree migration
    // path is never triggered for new ducklets).
    const doc = new Y.Doc();
    seedFiles(doc, template.files);
    const yjsData = uint8ArrayToBase64(Y.encodeStateAsUpdate(doc));

    createMutation.mutate({ name: trimmed, isPublic: true, yjsData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create a Ducklet</DialogTitle>
          <DialogDescription>
            Pick a starter template and start coding together.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {TEMPLATES.map((template) => {
              const visual = TEMPLATE_VISUALS[template.id];
              const Icon = visual?.icon ?? FileCode2;
              const selected = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                    "hover:border-primary/50 hover:bg-muted/40",
                    selected
                      ? "border-primary ring-primary/30 bg-muted/30 ring-2"
                      : "border-border",
                  )}
                >
                  <Icon className={cn("h-6 w-6", visual?.className)} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {template.label}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {template.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ducklet-name">Ducklet name</Label>
            <Input
              id="ducklet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Interview with John"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {createMutation.isPending ? "Creating…" : "Create Ducklet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

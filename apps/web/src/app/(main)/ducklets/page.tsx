"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import * as Y from "yjs";

import type { RouterOutputs } from "@acme/api";
import { authClient } from "~/auth/client";
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
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RenameDuckletDialog } from "~/components/collab-editor/rename-ducklet-dialog";
import { useDebounce } from "~/hooks/use-debounce";
import { useTRPC } from "~/trpc/react";

type DuckletSort = "recent" | "updated" | "oldest";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type DuckletListItem = RouterOutputs["ducklet"]["list"]["items"][number];

// Browser-safe base64 encoding for binary data (Y.js updates).
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export default function DuckletsPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDuckletName, setNewDuckletName] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DuckletSort>("recent");
  const debouncedSearch = useDebounce(search.trim(), 250);

  const {
    data: ducklets,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    trpc.ducklet.list.infiniteQueryOptions(
      {
        limit: 12,
        search: debouncedSearch || undefined,
        sort,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: 0,
      },
    ),
  );

  const allDucklets = ducklets?.pages.flatMap((p) => p.items) ?? [];

  const createDuckletMutation = useMutation(
    trpc.ducklet.create.mutationOptions({
      onSuccess: (ducklet) => {
        setIsCreateOpen(false);
        setNewDuckletName("");
        void queryClient.invalidateQueries(trpc.ducklet.list.infiniteQueryFilter());
        if (ducklet) {
          void router.push(`/ducklets/${ducklet.id}`);
        }
      },
    }),
  );

  const handleCreate = () => {
    if (!newDuckletName.trim()) return;

    const htmlContent = `
<div class="container">
  <h1>Hello World</h1>
  <p>Start coding!</p>
</div>
`.trim();

    const cssContent = `
.container {
  padding: 2rem;
  font-family: sans-serif;
}
h1 {
  color: #3b82f6;
}
`.trim();

    const jsContent = `console.log('Hello from your new Ducklet!');`;

    // Create YJS doc and populate it
    const doc = new Y.Doc();
    doc.getText("html").insert(0, htmlContent);
    doc.getText("css").insert(0, cssContent);
    doc.getText("js").insert(0, jsContent);

    // Encode state (browser-safe, no Node Buffer)
    const yjsData = uint8ArrayToBase64(Y.encodeStateAsUpdate(doc));

    createDuckletMutation.mutate({
      name: newDuckletName,
      isPublic: true,
      yjsData,
    });
  };

  const deleteDuckletMutation = useMutation(
    trpc.ducklet.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.ducklet.list.infiniteQueryFilter());
      },
    }),
  );

  const forkDuckletMutation = useMutation(
    trpc.ducklet.fork.mutationOptions({
      onSuccess: (forked) => {
        if (!forked) return;
        toast.success("Forked to your ducklets");
        void queryClient.invalidateQueries(trpc.ducklet.list.infiniteQueryFilter());
        void router.push(`/ducklets/${forked.id}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Ducklets
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Collaborative coding rooms for pair programming and interviews.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="shadow-lg transition-all hover:scale-[1.01]"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Ducklet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a Ducklet</DialogTitle>
              <DialogDescription>
                Create a new room to start coding with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-left">
                  Ducklet Name
                </Label>
                <Input
                  id="name"
                  value={newDuckletName}
                  onChange={(e) => setNewDuckletName(e.target.value)}
                  placeholder="e.g. Interview with John"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createDuckletMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createDuckletMutation.isPending || !newDuckletName.trim()
                }
              >
                {createDuckletMutation.isPending
                  ? "Creating..."
                  : "Create Ducklet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search ducklets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(val) => setSort(val as DuckletSort)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="updated">Recently edited</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden border-none shadow-md">
              <div className="bg-muted aspect-video w-full animate-pulse" />
              <CardHeader className="space-y-2">
                <div className="bg-muted h-6 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-10 w-full animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : allDucklets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-muted/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center"
        >
          <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <Plus className="text-muted-foreground h-10 w-10" />
          </div>
          <h3 className="text-2xl font-semibold">
            {debouncedSearch ? "No matches" : "No ducklets found"}
          </h3>
          <p className="text-muted-foreground mt-2 mb-8 max-w-sm">
            {debouncedSearch
              ? `Nothing matches "${debouncedSearch}". Try a different name.`
              : "You haven't created any Ducklets yet. Start your first collaborative coding session now!"}
          </p>
          {!debouncedSearch && (
            <Button size="lg" onClick={() => setIsCreateOpen(true)}>
              Create Your First Ducklet
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {allDucklets.map((ducklet) => (
              <DuckletCard
                key={ducklet.id}
                ducklet={ducklet}
                isOwner={ducklet.ownerId === currentUserId}
                isSignedIn={!!currentUserId}
                onDelete={() => deleteDuckletMutation.mutate({ id: ducklet.id })}
                isDeleting={
                  deleteDuckletMutation.isPending &&
                  deleteDuckletMutation.variables?.id === ducklet.id
                }
                onFork={() => forkDuckletMutation.mutate({ id: ducklet.id })}
                isForking={
                  forkDuckletMutation.isPending &&
                  forkDuckletMutation.variables?.id === ducklet.id
                }
              />
            ))}
          </motion.div>
          {hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DuckletCard({
  ducklet,
  isOwner,
  isSignedIn,
  onDelete,
  isDeleting,
  onFork,
  isForking,
}: {
  ducklet: DuckletListItem;
  isOwner: boolean;
  isSignedIn: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onFork: () => void;
  isForking: boolean;
}) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <motion.div variants={item}>
      <Card className="group border-muted/40 hover:border-primary/40 flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
        <Link href={`/ducklets/${ducklet.id}`} className="block">
          <div className="relative aspect-[1200/630] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            {ducklet.previewImage ? (
              <Image
                src={ducklet.previewImage}
                fill
                alt={`Preview of ${ducklet.name}`}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center opacity-20 transition-opacity group-hover:opacity-30">
                <Plus className="h-12 w-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge
                variant={ducklet.isPublic ? "secondary" : "outline"}
                className="bg-background/80 backdrop-blur-md"
              >
                {ducklet.isPublic ? (
                  <Globe className="mr-1 h-3 w-3" />
                ) : (
                  <Lock className="mr-1 h-3 w-3" />
                )}
                {ducklet.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </Link>

        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 overflow-hidden">
              <CardTitle className="truncate text-xl">
                <Link
                  href={`/ducklets/${ducklet.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {ducklet.name}
                </Link>
              </CardTitle>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={ducklet.owner?.photoURL ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {ducklet.owner?.username?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{ducklet.owner?.username}</span>
                <span>•</span>
                <span className="flex items-center">
                  {new Date(ducklet.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`More actions for ${ducklet.name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/ducklets/${ducklet.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Ducklet
                </DropdownMenuItem>
                {isSignedIn && (
                  <DropdownMenuItem
                    disabled={isForking}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFork();
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {isForking ? "Forking…" : "Fork"}
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {isOwner && (
              <>
                <RenameDuckletDialog
                  open={renameOpen}
                  onOpenChange={setRenameOpen}
                  duckletId={ducklet.id}
                  currentName={ducklet.name}
                />
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this ducklet?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{ducklet.name}</strong> will be permanently
                        deleted along with its chat history and member access.
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                          e.preventDefault();
                          onDelete();
                          setDeleteOpen(false);
                        }}
                      >
                        {isDeleting ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardHeader>

        <CardFooter className="bg-muted/5 mt-auto border-t p-4 sm:px-6">
          <Button
            asChild
            className="group/btn w-full font-semibold"
            variant="default"
          >
            <Link href={`/ducklets/${ducklet.id}`}>
              Join Session
              <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

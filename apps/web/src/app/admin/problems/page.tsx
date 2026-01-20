"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { ProblemFormDialog } from "./components/problem-form-dialog";

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminProblemsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery(
    trpc.problem.list.queryOptions({
      search: search || undefined,
      difficulty:
        difficulty === "all"
          ? undefined
          : (difficulty as "easy" | "medium" | "hard" | undefined),
      limit: 50,
    })
  );

  const updateMutation = useMutation(
    trpc.problem.update.mutationOptions({
      onSuccess: () => {
        refetch();
        toast.success("Problem updated");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.problem.delete.mutationOptions({
      onSuccess: () => {
        refetch();
        toast.success("Problem deleted");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const duplicateMutation = useMutation(
    trpc.problem.duplicate.mutationOptions({
      onSuccess: () => {
        refetch();
        toast.success("Problem duplicated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleDelete = async (id: number) => {
    deleteMutation.mutate({ id });
    setDeleteId(null);
  };

  const handleDuplicate = async (id: number) => {
    duplicateMutation.mutate({ id });
  };

  const openCreateDialog = () => {
    setSelectedProblemId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    setSelectedProblemId(id);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Problems</h1>
          <p className="text-muted-foreground">
            Create and manage coding problems
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Problem
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[200px]">Tags</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No problems found. Create your first problem to get started.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((problem, index) => (
                <TableRow key={problem.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => openEditDialog(problem.id)}
                        className="font-medium hover:underline text-left"
                      >
                        {problem.title}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        /{problem.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize font-normal",
                        DIFFICULTY_COLORS[problem.difficulty]
                      )}
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          +{problem.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={(problem as any).isActive !== false ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {(problem as any).isActive !== false ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(problem.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(problem.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleActive(problem.id, (problem as any).isActive !== false)
                          }
                        >
                          {(problem as any).isActive !== false ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Set as Draft
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(problem.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      {data && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {data.items.length} of {data.total} problems
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Problem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this problem? This action cannot be
              undone. All associated submissions will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Problem Editor Dialog */}
      <ProblemFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        problemId={selectedProblemId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

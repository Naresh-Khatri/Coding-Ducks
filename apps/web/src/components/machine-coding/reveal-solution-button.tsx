"use client";

import { Lightbulb } from "lucide-react";

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

import { useMachineCodingTests } from "./use-tests";

/**
 * Compact "reveal the reference solution" action, lives in the Problem panel's
 * header toolbar. Confirms first (it marks the attempt as having viewed the
 * solution and loads it as diffs in the editor).
 */
export function RevealSolutionButton() {
  const { revealed, reveal, revealPending } = useMachineCodingTests();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={revealPending}
          title="Reveal the reference solution"
        >
          <Lightbulb className="mr-1 size-3.5" />
          {revealed ? "Solution" : "Reveal"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reveal the solution?</AlertDialogTitle>
          <AlertDialogDescription>
            The reference solution will load as diffs against your code in the
            editor, and the editorial will appear in the Problem panel. This
            marks the attempt as having viewed the solution.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={reveal}>Reveal solution</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { Markdown } from "~/components/markdown";

import type { MachineCodingContext } from "./types";
import { useMachineCodingTests } from "./use-tests";

/**
 * The Problem side panel: just the statement, plus the editorial once the
 * solution has been revealed. All actions live elsewhere — "Run tests" in the
 * Tests drawer, "Reveal solution" in this panel's header toolbar — and
 * completion is implicit (all tests passing).
 */
export function MachineCodingPanel({
  context,
}: {
  context: MachineCodingContext;
}) {
  const { revealed, editorial } = useMachineCodingTests();

  return (
    // A plain overflow container so prose wraps to the panel width (Radix
    // ScrollArea's table layout doesn't).
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <Markdown>{context.description}</Markdown>

        {revealed && editorial && (
          <div className="mt-8 border-t pt-6">
            <Markdown>{editorial}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

import { CheckCircle2, Circle, CircleDashed, Eye } from "lucide-react";

import { STATUS_LABELS } from "~/lib/machine-coding/labels";
import { cn } from "~/lib/utils";

/**
 * The per-problem attempt-state glyph: a distinct, meaningful icon for each of
 * completed / solution-viewed / in-progress / not-started. Shared by the
 * catalogue rows and the solve-page problem sheet so both stay in sync.
 */
export function ProblemStatusIcon({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const label = status ? (STATUS_LABELS[status] ?? status) : "Not started";

  if (status === "completed") {
    return (
      <CheckCircle2
        className={cn("shrink-0 text-green-500", className)}
        aria-label={label}
      />
    );
  }
  if (status === "revealed") {
    return (
      <Eye
        className={cn("shrink-0 text-orange-500", className)}
        aria-label={label}
      />
    );
  }
  if (status === "in-progress") {
    return (
      <CircleDashed
        className={cn("shrink-0 text-amber-500", className)}
        aria-label={label}
      />
    );
  }
  return (
    <Circle
      className={cn("text-muted-foreground/30 shrink-0", className)}
      aria-label={label}
    />
  );
}

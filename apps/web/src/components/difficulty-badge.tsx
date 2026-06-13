import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

/** Shared difficulty → color map, used by Problems and Practice. */
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

/** Text-only variant for inline metadata strips (no pill background). */
export const DIFFICULTY_TEXT_COLORS: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-amber-400",
  hard: "text-red-400",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal capitalize",
        DIFFICULTY_COLORS[difficulty],
        className,
      )}
    >
      {difficulty}
    </Badge>
  );
}

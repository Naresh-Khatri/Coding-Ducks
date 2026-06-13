import { VARIANT_ICON_SRCS } from "~/lib/machine-coding/labels";
import { cn } from "~/lib/utils";

/**
 * The brand logos for every variant a problem can be solved in — a JS/TS pair
 * for utilities, React/Vue/Svelte for UI components. Driven by the problem's
 * actual `variants` (not its category), so it stays in sync as variants are
 * added. Renders nothing when no variant has a known icon. Shared by the
 * catalogue rows, the problem sheet, and the solve-page Description header.
 */
export function VariantIcons({
  variants,
  className,
}: {
  variants: { id: string; label: string }[];
  className?: string;
}) {
  const icons = variants
    .map((v) => VARIANT_ICON_SRCS[v.id])
    .filter((icon): icon is { src: string; alt: string } => !!icon);
  if (!icons.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {icons.map((icon) => (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static tech-stack SVG
        <img
          key={icon.src}
          src={icon.src}
          alt={icon.alt}
          title={icon.alt}
          className={cn("size-3.5 object-contain", className)}
        />
      ))}
    </span>
  );
}

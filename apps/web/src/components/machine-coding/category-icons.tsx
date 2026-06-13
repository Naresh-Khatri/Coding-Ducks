import { CATEGORY_ICON_SRCS } from "~/lib/machine-coding/labels";
import { cn } from "~/lib/utils";

/**
 * The tech-stack logos for a practice category (React for UI/app, JS + TS for
 * utilities). Renders nothing for an unknown category. Shared by the catalogue
 * rows and the solve-page Problem panel so both stay in sync.
 */
export function CategoryIcons({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const icons = CATEGORY_ICON_SRCS[category];
  if (!icons?.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {icons.map((icon) => (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static tech-stack SVG
        <img
          key={icon.src}
          src={icon.src}
          alt={icon.alt}
          className={cn("size-3.5 object-contain", className)}
        />
      ))}
    </span>
  );
}

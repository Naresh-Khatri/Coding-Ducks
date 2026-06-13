"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { VARIANT_ICON_SRCS } from "~/lib/machine-coding/labels";

export interface VariantOption {
  id: string;
  label: string;
}

/** The brand logo for a variant id, if one is known. */
function VariantIcon({ id }: { id: string }) {
  const icon = VARIANT_ICON_SRCS[id];
  if (!icon) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static brand SVG
    <img
      src={icon.src}
      alt={icon.alt}
      className="size-4 shrink-0 object-contain"
    />
  );
}

/**
 * Dropdown selector for a problem's variants — a JS/TS language switch for
 * js-utility problems, a React/Vue/Svelte framework switch for ui-component
 * ones. Each option carries its brand logo. Variants keep their own draft (see
 * `useLocalMachineCodingDoc`), so switching is non-destructive. Rendered only
 * when there's more than one option.
 */
export function VariantSelector({
  options,
  value,
  onChange,
}: {
  options: VariantOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-8 w-auto gap-1.5 [&>span]:flex [&>span]:items-center [&>span]:gap-1.5"
        aria-label="Variant"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            <span className="flex items-center gap-2">
              <VariantIcon id={opt.id} />
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

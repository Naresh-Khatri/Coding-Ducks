"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a radial spotlight that follows the cursor, plus a hover lift and
 * border highlight. The signature retro micro-interaction reused across cards.
 */
export function SpotlightCard({
  children,
  className,
  glow = "rgba(157,78,221,0.22)",
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/30 hover:shadow-[0_0_30px_-5px_rgba(157,78,221,0.4)]",
        className,
      )}
    >
      {/* cursor-following spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}

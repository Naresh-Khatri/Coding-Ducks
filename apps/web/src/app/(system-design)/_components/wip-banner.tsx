"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export function WipBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence initial={true}>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="shrink-0 overflow-hidden"
        >
          <div className="relative flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-8 py-1.5 text-center text-[11px] font-medium text-amber-700 dark:text-amber-300">
            <span aria-hidden>🚧</span>
            <span>
              Early preview — expect bugs, missing pieces, and rough edges.
            </span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded hover:bg-amber-500/20"
              aria-label="Dismiss banner"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

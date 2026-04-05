"use client";

import type { DragEvent } from "react";
import { useState } from "react";
import * as Icons from "lucide-react";
import {
  ChevronDown,
  Database,
  Mail,
  Network,
  Server,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";

import type { BlockCategory, BlockNodeData } from "~/lib/system-design/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  getBlockDefinition,
  getBlocksByCategory,
} from "~/lib/system-design/block-registry";
import { useSystemDesignStore } from "~/lib/system-design/store";
import { cn } from "~/lib/utils";

const CATEGORY_CONFIG: Record<
  BlockCategory,
  { label: string; icon: React.ReactNode }
> = {
  networking: { label: "Networking", icon: <Network size={14} /> },
  compute: { label: "Compute", icon: <Server size={14} /> },
  storage: { label: "Storage", icon: <Database size={14} /> },
  messaging: { label: "Messaging", icon: <Mail size={14} /> },
  security: { label: "Security", icon: <Shield size={14} /> },
};

export function BlockPalette() {
  const grouped = getBlocksByCategory();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    networking: true,
    compute: true,
    storage: true,
    messaging: true,
    security: true,
  });
  const [defaultProviders, setDefaultProviders] = useState<
    Record<string, string>
  >({});

  const nodes = useSystemDesignStore((s) => s.nodes);
  const level = useSystemDesignStore((s) => s.level);
  const phase = useSystemDesignStore((s) => s.phase);
  const addBlockToCenter = useSystemDesignStore((s) => s.addBlockToCenter);

  const budgetUsed = nodes.reduce(
    (sum, n) => sum + (n.data as BlockNodeData).definition.costPerMonth,
    0,
  );

  const onDragStart = (e: DragEvent, blockType: string, provider: string) => {
    e.dataTransfer.setData("application/system-design-block", blockType);
    e.dataTransfer.setData("application/system-design-provider", provider);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-1 p-2">
        <div className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wider uppercase">
          Blocks
        </div>
        {(Object.keys(CATEGORY_CONFIG) as BlockCategory[]).map((category) => {
          const blocks = grouped[category];
          if (blocks.length === 0) return null;
          const config = CATEGORY_CONFIG[category];
          const isCatExpanded = expandedCategories[category];

          return (
            <div key={category}>
              <button
                className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                onClick={() =>
                  setExpandedCategories((s) => ({
                    ...s,
                    [category]: !s[category],
                  }))
                }
              >
                {config.icon}
                <span className="flex-1 text-left">{config.label}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    isCatExpanded && "rotate-180",
                  )}
                />
              </button>
              {isCatExpanded && (
                <div className="mt-0.5 space-y-0.5 pl-1">
                  {blocks.map((block) => {
                    const currentDefault =
                      defaultProviders[block.type] ?? block.name;
                    const providerData = block.providers?.find(
                      (p) => p.provider === currentDefault,
                    );
                    const cost =
                      providerData?.costPerMonth ?? block.costPerMonth;
                    const wouldExceed =
                      level !== null && budgetUsed + cost > level.budget;
                    const isDisabled = phase !== "building" || wouldExceed;

                    const IconComponent =
                      (
                        Icons as unknown as Record<
                          string,
                          React.ComponentType<{ size?: number }>
                        >
                      )[block.icon] ?? Icons.Box;

                    const hasProviders =
                      block.providers && block.providers.length > 1;

                    return (
                      <div
                        key={block.type}
                        className={cn(
                          "bg-card rounded-md border transition-colors",
                          isDisabled && "opacity-40",
                        )}
                      >
                        {/* Block row — draggable + clickable */}
                        <div
                          draggable={!isDisabled}
                          onDragStart={(e) =>
                            onDragStart(e, block.type, currentDefault)
                          }
                          onClick={() => {
                            if (isDisabled) return;
                            const baseDef = getBlockDefinition(block.type);
                            if (!baseDef) return;
                            const provider = baseDef.providers?.find(
                              (p) => p.provider === currentDefault,
                            );
                            const def = provider
                              ? {
                                  ...baseDef,
                                  name: provider.provider,
                                  costPerMonth: provider.costPerMonth,
                                  maxRps: provider.maxRps,
                                  maxConnections: provider.maxConnections,
                                  baseLatencyMs: provider.baseLatencyMs,
                                }
                              : baseDef;
                            addBlockToCenter(def);
                          }}
                          className={cn(
                            "group flex items-center gap-2 rounded-md p-2 text-xs",
                            !isDisabled &&
                              "hover:bg-muted cursor-pointer active:cursor-grabbing",
                            isDisabled && "cursor-not-allowed",
                          )}
                        >
                          <motion.div
                            className={cn(
                              "flex w-0 overflow-hidden opacity-0 transition-all duration-200",
                              "group-hover:w-4 group-hover:opacity-100",
                            )}
                          >
                            <Icons.GripVertical size={16} />
                          </motion.div>
                          <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded">
                            <IconComponent size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {block.label}
                            </div>
                            {/* <div className="text-muted-foreground text-[10px]"> */}
                            {/*   {currentDefault} */}
                            {/* </div> */}
                          </div>
                          <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                            ${cost}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

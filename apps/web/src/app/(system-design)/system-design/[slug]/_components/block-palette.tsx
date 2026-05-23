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

import type { BlockCategory, BlockNodeData } from "~/lib/system-design/types";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
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

  const budgetUsed = nodes.reduce((sum, n) => {
    const d = n.data;
    return sum + d.definition.costPerMonth * (d.replicas ?? 1);
  }, 0);

  const onDragStart = (e: DragEvent, blockType: string, provider: string) => {
    e.dataTransfer.setData("application/system-design-block", blockType);
    e.dataTransfer.setData("application/system-design-provider", provider);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-1 p-2" data-tour="sd-palette">
        <div className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wider uppercase">
          Blocks
        </div>
        {(Object.keys(CATEGORY_CONFIG) as BlockCategory[])
          .filter((category) => grouped[category].length > 0)
          .map((category, idx) => {
            const blocks = grouped[category];
            const config = CATEGORY_CONFIG[category];
            const isCatExpanded = expandedCategories[category];

            return (
              <div key={category}>
                {idx > 0 && <Separator className="my-1" />}
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
                  <div className="mt-1 grid grid-cols-2 gap-1 pl-1">
                    {blocks.map((block) => {
                      const currentDefault =
                        defaultProviders[block.type] ?? block.name;
                      const providerData = block.providers?.find(
                        (p) => p.provider === currentDefault,
                      );
                      const cost =
                        providerData?.costPerMonth ?? block.costPerMonth;
                      const providerCosts = block.providers?.map(
                        (p) => p.costPerMonth,
                      );
                      const minCost = providerCosts?.length
                        ? Math.min(...providerCosts)
                        : block.costPerMonth;
                      const maxCost = providerCosts?.length
                        ? Math.max(...providerCosts)
                        : block.costPerMonth;
                      const hasRange = minCost !== maxCost;
                      const costLabel = hasRange
                        ? `$${minCost}–$${maxCost}`
                        : `$${minCost}`;
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

                      return (
                        <div
                          key={block.type}
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
                          title={`${block.label} — ${costLabel}/mo`}
                          className={cn(
                            "bg-card flex items-center gap-2 rounded-md border p-2 transition-colors",
                            !isDisabled &&
                              "hover:bg-muted hover:border-foreground/20 cursor-grab active:cursor-grabbing",
                            isDisabled && "cursor-not-allowed opacity-40",
                          )}
                        >
                          <div className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded">
                            <IconComponent size={14} />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="truncate text-[11px] leading-tight font-medium">
                              {block.label}
                            </div>
                            <span className="text-muted-foreground text-[10px] tabular-nums">
                              {costLabel}
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

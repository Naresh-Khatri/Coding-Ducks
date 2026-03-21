"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { useTRPC } from "~/trpc/react";

export function SkillTags({ username }: { username: string }) {
  const trpc = useTRPC();
  const { data: tags } = useQuery(
    trpc.profile.skillTags.queryOptions({ username }),
  );

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Skills</h3>
      {!tags || tags.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No skills unlocked yet
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.tag}
              variant="secondary"
              className="gap-1.5 px-3 py-1"
            >
              {tag.tag}
              <span className="text-muted-foreground text-[10px]">
                x{tag.count}
              </span>
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

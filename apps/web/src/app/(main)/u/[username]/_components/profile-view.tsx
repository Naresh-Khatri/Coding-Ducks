"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { ActivityFeed } from "./activity-feed";
import { ProfileHeader } from "./profile-header";
import { SkillTags } from "./skill-tags";
import { SolveChart } from "./solve-chart";
import { StatsOverview } from "./stats-overview";
import { SubmissionHeatmap } from "./submission-heatmap";

export function ProfileView({ username }: { username: string }) {
  const trpc = useTRPC();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery(trpc.profile.byUsername.queryOptions({ username }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">User not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <ProfileHeader profile={profile} />
      <StatsOverview username={username} profile={profile} />
      <SubmissionHeatmap username={username} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SolveChart username={username} />
        <SkillTags username={username} />
      </div>
      <ActivityFeed username={username} />
    </div>
  );
}

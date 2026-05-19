"use client";

import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import type { ProblemDetail, SubmissionDetail } from "../types";
import { markdownComponents } from "./markdown-components";

const LANGUAGES: Array<{ key: string; label: string }> = [
  { key: "py", label: "Python" },
  { key: "js", label: "JavaScript" },
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
  { key: "c", label: "C" },
];

interface LeftPanelProps {
  problem: ProblemDetail;
  submissions: SubmissionDetail[] | undefined;
  leftTab: string;
  onLeftTabChange: (tab: string) => void;
  onSelectSubmission: (sub: SubmissionDetail) => void;
}

export function LeftPanel({
  problem,
  submissions,
  leftTab,
  onLeftTabChange,
  onSelectSubmission,
}: LeftPanelProps) {
  const tabTriggerClass =
    "data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground h-full rounded-none border-b-2 border-transparent px-0 text-xs font-bold tracking-wider uppercase transition-all data-[state=active]:bg-transparent";

  return (
    <Tabs
      value={leftTab}
      onValueChange={onLeftTabChange}
      className="flex h-full flex-col"
    >
      <div className="border-b px-4 backdrop-blur-sm">
        <TabsList className="h-10 gap-6 bg-transparent p-0">
          <TabsTrigger value="description" className={tabTriggerClass}>
            Description
          </TabsTrigger>
          <TabsTrigger value="editorial" className={tabTriggerClass}>
            Editorial
          </TabsTrigger>
          <TabsTrigger value="submissions" className={tabTriggerClass}>
            Submissions
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Description */}
      <TabsContent
        value="description"
        className="custom-scrollbar m-0 flex-1 overflow-y-auto"
      >
        <div className="p-6 pb-32">
          {/* Title + difficulty badge */}
          <div className="mb-4 flex items-center gap-3">
            {/* <h1 className="text-foreground text-xl font-bold tracking-tight"> */}
            {/*   {problem.title} */}
            {/* </h1> */}
            <Badge
              variant="outline"
              className={cn(
                "border-none px-2 py-0.5 text-[10px] font-bold tracking-wider capitalize",
                problem.difficulty === "easy" &&
                  "bg-emerald-500/10 text-emerald-500",
                problem.difficulty === "medium" &&
                  "bg-amber-500/10 text-amber-500",
                problem.difficulty === "hard" && "bg-rose-500/10 text-rose-500",
              )}
            >
              {problem.difficulty}
            </Badge>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {problem.description}
            </ReactMarkdown>
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div className="mt-12 border-t border-white/5 pt-8">
              <h3 className="text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase">
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer border-none bg-white/5 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white/10"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Editorial */}
      <TabsContent
        value="editorial"
        className="custom-scrollbar m-0 flex-1 overflow-y-auto"
      >
        {problem.editorial ? (
          <div className="p-6 pb-32">
            <div className="prose prose-invert prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {problem.editorial}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
            <p className="text-muted-foreground text-sm font-medium">
              No editorial available yet
            </p>
          </div>
        )}
      </TabsContent>

      {/* Submissions */}
      <TabsContent
        value="submissions"
        className="custom-scrollbar m-0 flex-1 overflow-y-auto"
      >
        {submissions && submissions.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-white/5 text-[11px]">
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Language</th>
                <th className="px-4 py-2 font-medium">Runtime</th>
                <th className="px-4 py-2 font-medium">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.map((sub) => {
                const langLabel =
                  LANGUAGES.find((l) => l.key === sub.lang)?.label || sub.lang;
                return (
                  <tr
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-xs font-semibold capitalize",
                            sub.status === "accepted"
                              ? "text-emerald-500"
                              : sub.status === "time_limit"
                                ? "text-amber-500"
                                : "text-rose-500",
                          )}
                        >
                          {sub.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground/60 text-[10px]">
                          {new Date(sub.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5">
                      {langLabel}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 font-mono">
                      {sub.runtime != null ? `${sub.runtime} ms` : "N/A"}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 font-mono">
                      {sub.memory != null
                        ? sub.memory >= 1024
                          ? `${(sub.memory / 1024).toFixed(1)} MB`
                          : `${sub.memory} KB`
                        : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
            <Send className="text-muted-foreground mb-4 h-8 w-8" />
            <p className="text-muted-foreground text-xs font-medium">
              No submissions yet
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

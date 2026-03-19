"use client";

import { Cloud } from "lucide-react";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import { cn } from "~/lib/utils";

const LANGUAGES: Array<{ key: string; label: string }> = [
  { key: "py", label: "Python" },
  { key: "js", label: "JavaScript" },
  { key: "cpp", label: "C++" },
  { key: "java", label: "Java" },
  { key: "c", label: "C" },
];

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  availableLanguages: string[];
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export function CodeEditorPanel({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  availableLanguages,
  saveStatus,
}: CodeEditorPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-card/50 flex items-center justify-between border-b px-4 py-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/80 flex h-2 w-2 animate-pulse rounded-full" />
          <span className="text-muted-foreground/80 font-bold tracking-wider uppercase">
            Code Editor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Cloud
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                saveStatus === "saving"
                  ? "text-muted-foreground animate-pulse"
                  : saveStatus === "saved"
                    ? "text-emerald-500/70"
                    : saveStatus === "error"
                      ? "text-rose-500/70"
                      : "text-muted-foreground/40",
              )}
            />
            {saveStatus === "saving" && (
              <span className="text-muted-foreground animate-pulse text-[10px]">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-emerald-500/70 text-[10px]">
                Saved to cloud
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-rose-500/70 text-[10px]">Save failed</span>
            )}
          </div>
          <div className="bg-border h-4 w-px" />
          <select
            className="hover:text-primary cursor-pointer border-none bg-transparent pr-2 text-xs font-bold transition-colors outline-none"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
          >
            {availableLanguages.map((lang) => (
              <option
                key={lang}
                value={lang}
                className="bg-popover text-foreground"
              >
                {LANGUAGES.find((l) => l.key === lang)?.label || lang}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative flex-1 bg-[#1e1e1e]">
        <CodeEditor
          value={code}
          onChange={onCodeChange}
          language={language}
          height="100%"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}

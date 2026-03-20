"use client";

import { Cloud } from "lucide-react";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { LANGUAGES } from "~/lib/languages";
import { cn } from "~/lib/utils";

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
  const currentLang = LANGUAGES.find((l) => l.key === language);

  return (
    <div className="flex h-full flex-col">
      <div className="bg-card/50 flex items-center justify-between border-b px-4 py-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Select
            value={language}
            onValueChange={(val) => onLanguageChange(val as Language)}
          >
            <SelectTrigger className="h-6 w-auto gap-1.5 border-none bg-transparent px-1.5 py-0 text-xs font-bold shadow-none focus:ring-0">
              <div className="flex items-center gap-1.5">
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => {
                const langInfo = LANGUAGES.find((l) => l.key === lang);
                const Icon = langInfo?.icon;
                return (
                  <SelectItem key={lang} value={lang}>
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      <span>{langInfo?.label ?? lang}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
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
            <span className="text-[10px] text-emerald-500/70">
              Saved to cloud
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-[10px] text-rose-500/70">Save failed</span>
          )}
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

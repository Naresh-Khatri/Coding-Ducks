"use client";

import { useRef } from "react";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { indentRange } from "@codemirror/language";
import { Cloud, History, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import type { Language } from "~/components/code-editor";
import { CodeEditor } from "~/components/code-editor";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useConfirm } from "~/hooks/use-confirm";
import { LANGUAGES } from "~/lib/languages";
import { cn } from "~/lib/utils";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  availableLanguages: string[];
  saveStatus: "idle" | "saving" | "saved" | "error";
  onRetrieveLastSubmission?: () => void;
  onResetToDefault?: () => void;
  hasLastSubmission?: boolean;
}

export function CodeEditorPanel({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  availableLanguages,
  saveStatus,
  onRetrieveLastSubmission,
  onResetToDefault,
  hasLastSubmission,
}: CodeEditorPanelProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const handleFormat = () => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { doc } = view.state;
    const changes = indentRange(view.state, 0, doc.length);
    if (changes) {
      view.dispatch({ changes });
      toast.success("Code formatted");
    }
  };

  const [resetDialog, triggerReset] = useConfirm({
    title: "Reset to default code?",
    description:
      "This will replace your current code with the original starter code. Any changes will be lost.",
    confirmLabel: "Reset",
    onConfirm: () => {
      onResetToDefault?.();
    },
  });

  const [retrieveDialog, triggerRetrieve] = useConfirm({
    title: "Load last submission?",
    description:
      "This will replace your current code with the code from your last submission.",
    confirmLabel: "Load",
    onConfirm: () => {
      onRetrieveLastSubmission?.();
    },
  });

  return (
    <div className="flex h-full flex-col">
      {resetDialog}
      {retrieveDialog}
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
        <div className="flex items-center gap-1">
          <div className="mr-2 flex items-center gap-1.5">
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
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleFormat}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Format code</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={triggerRetrieve}
                  disabled={!hasLastSubmission}
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Retrieve last submission</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={triggerReset}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Reset to default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="relative flex-1 bg-[#1e1e1e]">
        <CodeEditor
          editorRef={editorRef}
          value={code}
          onChange={onCodeChange}
          language={language}
          height="100%"
          className="absolute inset-0"
          onSave={() => toast.success("Code formatted & saved")}
        />
      </div>
    </div>
  );
}

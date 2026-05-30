"use client";

import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";
import { indentRange } from "@codemirror/language";
import { getCM } from "@replit/codemirror-vim";
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
import { EditorSettingsDialog } from "~/components/editor-settings-dialog";
import { useConfirm } from "~/hooks/use-confirm";
import { useEditorSettings } from "~/hooks/use-editor-settings";
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
  onRun?: () => void;
  onSubmit?: () => void;
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
  onRun,
  onSubmit,
}: CodeEditorPanelProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const {
    fontSize,
    fontFamily,
    fontLigatures,
    tabSize,
    relativeLineNumbers,
    keymap,
    runShortcut,
    submitShortcut,
  } = useEditorSettings();
  const isVim = keymap === "vim";
  const [vimModeLabel, setVimModeLabel] = useState("NORMAL");

  useEffect(() => {
    if (!isVim) return;
    const id = setInterval(() => {
      const view = editorRef.current?.view;
      if (!view) return;
      const cm = getCM(view);
      if (!cm) return;
      const state = (
        cm as {
          state?: { vim?: { insertMode?: boolean; visualMode?: boolean } };
        }
      ).state?.vim;
      if (!state) return;
      if (state.insertMode) setVimModeLabel("INSERT");
      else if (state.visualMode) setVimModeLabel("VISUAL");
      else setVimModeLabel("NORMAL");
    }, 100);
    return () => clearInterval(id);
  }, [isVim]);

  const handleFormat = () => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { doc } = view.state;
    const changes = indentRange(view.state, 0, doc.length);
    if (changes) {
      view.dispatch({ changes });
      toast.success("Code re-indented");
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
                  aria-label="Re-indent code"
                  className="h-6 w-6"
                  onClick={handleFormat}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Re-indent code</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Retrieve last submission"
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
                  aria-label="Reset to default code"
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <EditorSettingsDialog />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Editor settings</p>
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
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontLigatures={fontLigatures}
          tabSize={tabSize}
          relativeLineNumbers={relativeLineNumbers}
          vimMode={isVim}
          height="100%"
          className="absolute inset-0"
          onSave={() => toast.success("Draft saved")}
          onRun={runShortcut ? onRun : undefined}
          onSubmit={submitShortcut ? onSubmit : undefined}
        />
      </div>
      {isVim && (
        <div className="flex h-6 items-center border-t bg-[#1e1e1e] px-3">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
              vimModeLabel === "INSERT"
                ? "bg-emerald-500/20 text-emerald-400"
                : vimModeLabel === "VISUAL"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400",
            )}
          >
            -- {vimModeLabel} --
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { Minus, Plus, Settings } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { FONT_OPTIONS, useEditorSettings } from "~/hooks/use-editor-settings";

export function EditorSettingsDialog() {
  const s = useEditorSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editor settings"
          className="h-6 w-6"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editor Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Font Size */}
          <Row label="Font Size">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => s.set({ fontSize: s.fontSize - 1 })}
                disabled={s.fontSize <= 10}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-mono text-sm tabular-nums">
                {s.fontSize}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => s.set({ fontSize: s.fontSize + 1 })}
                disabled={s.fontSize >= 24}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </Row>

          {/* Font Family */}
          <Row label="Font">
            <Select
              value={s.fontFamily}
              onValueChange={(v) => s.set({ fontFamily: v })}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.label} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {/* Font Ligatures */}
          <Row label="Font Ligatures">
            <Switch
              checked={s.fontLigatures}
              onCheckedChange={(v) => s.set({ fontLigatures: v })}
            />
          </Row>

          {/* Tab Size */}
          <Row label="Tab Size">
            <Select
              value={String(s.tabSize)}
              onValueChange={(v) => s.set({ tabSize: Number(v) })}
            >
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 4, 8].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {/* Relative Line Numbers */}
          <Row label="Relative Line Numbers">
            <Switch
              checked={s.relativeLineNumbers}
              onCheckedChange={(v) => s.set({ relativeLineNumbers: v })}
            />
          </Row>

          {/* Keymap */}
          <Row label="Keybindings">
            <Select
              value={s.keymap}
              onValueChange={(v) => s.set({ keymap: v as "default" | "vim" })}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="vim">Vim</SelectItem>
              </SelectContent>
            </Select>
          </Row>

          {/* Shortcuts */}
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Shortcuts
            </span>
            <Row label="Run code" sublabel="Ctrl+Enter">
              <Switch
                checked={s.runShortcut}
                onCheckedChange={(v) => s.set({ runShortcut: v })}
              />
            </Row>
            <Row label="Submit code" sublabel="Ctrl+Shift+Enter">
              <Switch
                checked={s.submitShortcut}
                onCheckedChange={(v) => s.set({ submitShortcut: v })}
              />
            </Row>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {sublabel && (
          <kbd className="text-muted-foreground ml-2 text-xs">{sublabel}</kbd>
        )}
      </div>
      {children}
    </div>
  );
}

import { useCallback, useSyncExternalStore } from "react";

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  fontLigatures: boolean;
  tabSize: number;
  relativeLineNumbers: boolean;
  keymap: "default" | "vim";
  runShortcut: boolean;
  submitShortcut: boolean;
}

export const FONT_OPTIONS = [
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Fira Code", value: "'Fira Code', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { label: "System Mono", value: "monospace" },
] as const;

const STORAGE_KEY = "editor-settings";
const defaults: EditorSettings = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', monospace",
  fontLigatures: false,
  tabSize: 2,
  relativeLineNumbers: false,
  keymap: "default",
  runShortcut: true,
  submitShortcut: true,
};

let listeners: (() => void)[] = [];
let cached: EditorSettings = defaults;

function read(): EditorSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function getSnapshot(): EditorSettings {
  return cached;
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  cached = read();
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function persist(update: Partial<EditorSettings>) {
  cached = { ...cached, ...update };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  listeners.forEach((l) => l());
}

export function useEditorSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => defaults);

  const set = useCallback((update: Partial<EditorSettings>) => {
    if (update.fontSize != null) {
      update.fontSize = Math.min(24, Math.max(10, update.fontSize));
    }
    if (update.tabSize != null) {
      update.tabSize = Math.min(8, Math.max(1, update.tabSize));
    }
    persist(update);
  }, []);

  return { ...settings, set };
}

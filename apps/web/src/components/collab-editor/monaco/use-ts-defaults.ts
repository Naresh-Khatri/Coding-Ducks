"use client";

import { useEffect } from "react";
import type { Monaco } from "@monaco-editor/react";
import { setupTypeAcquisition } from "@typescript/ata";
import * as ts from "typescript";
import type * as Y from "yjs";

import { getFileText, getFilesMap, readAllFiles } from "@acme/ducklet-fs";

import { isTsLike } from "./lang";

type TsNamespace = Monaco["languages"]["typescript"];
type CompilerOptions = Parameters<
  TsNamespace["typescriptDefaults"]["setCompilerOptions"]
>[0];

/** Tolerant JSON (strips // and /* *\/ comments + trailing commas) for tsconfig. */
function parseLooseJson(raw: string): Record<string, unknown> | null {
  try {
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
      .replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function compilerOptionsFromDoc(
  ydoc: Y.Doc,
  tsNs: TsNamespace,
): CompilerOptions {
  const raw = getFileText(ydoc, "tsconfig.json")?.toJSON();
  const cfg = raw ? parseLooseJson(raw) : null;
  const userOpts = (cfg?.compilerOptions ?? {}) as Record<string, unknown>;

  // In-editor type-checking favours the modern automatic JSX runtime so `.tsx`
  // works without importing React, regardless of the project's emit setting.
  return {
    target: tsNs.ScriptTarget.ESNext,
    module: tsNs.ModuleKind.ESNext,
    moduleResolution: tsNs.ModuleResolutionKind.NodeJs,
    jsx: tsNs.JsxEmit.ReactJSX,
    jsxImportSource: "react",
    allowJs: true,
    checkJs: false,
    esModuleInterop: true,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    strict: (userOpts.strict as boolean | undefined) ?? true,
    baseUrl: ".",
    paths: userOpts.paths as Record<string, string[]> | undefined,
    typeRoots: ["node_modules/@types"],
  };
}

/**
 * Configure Monaco's first-party TS/JS language service for the ducklet:
 * compiler options derived from the project's `tsconfig.json`, plus automatic
 * type acquisition (ATA) that fetches dependency `.d.ts` from a CDN based on
 * the imports it sees — which is what makes auto-imports of `react`, `next`,
 * etc. resolve.
 */
export function useTsDefaults({
  monaco,
  ydoc,
  enabled,
}: {
  monaco: Monaco | null;
  ydoc: Y.Doc;
  enabled: boolean;
}): void {
  useEffect(() => {
    if (!monaco) return;
    const tsNs = monaco.languages.typescript;
    const off = { noSemanticValidation: true, noSyntaxValidation: true };

    if (!enabled) {
      tsNs.typescriptDefaults.setDiagnosticsOptions(off);
      tsNs.javascriptDefaults.setDiagnosticsOptions(off);
      return;
    }

    const filesMap = getFilesMap(ydoc);

    // `setCompilerOptions` fires Monaco's onDidChange, which recreates the TS
    // worker and discards its warmed program — far from free. Only re-apply
    // when `tsconfig.json` actually changes, never on every keystroke.
    let lastTsconfig = getFileText(ydoc, "tsconfig.json")?.toJSON() ?? "";
    const applyOptions = () => {
      const opts = compilerOptionsFromDoc(ydoc, tsNs);
      tsNs.typescriptDefaults.setCompilerOptions(opts);
      tsNs.javascriptDefaults.setCompilerOptions(opts);
    };

    tsNs.typescriptDefaults.setEagerModelSync(true);
    tsNs.javascriptDefaults.setEagerModelSync(true);
    tsNs.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    applyOptions();

    // Automatic type acquisition for npm dependencies.
    const addedLibs = new Set<string>();
    const ata = setupTypeAcquisition({
      projectName: "ducklet",
      typescript: ts,
      logger: console,
      delegate: {
        receivedFile: (code, path) => {
          if (addedLibs.has(path)) return;
          addedLibs.add(path);
          try {
            tsNs.typescriptDefaults.addExtraLib(code, `file://${path}`);
          } catch {
            // Already registered (e.g. across a re-run) — harmless.
          }
        },
      },
    });

    // Feed ATA the package.json + every TS/JS source so it can discover imports.
    let ataTimer: ReturnType<typeof setTimeout> | null = null;
    const runAta = () => {
      const files = readAllFiles(ydoc);
      let src = files["package.json"] ? `${files["package.json"]}\n` : "";
      for (const [path, content] of Object.entries(files)) {
        if (isTsLike(path)) src += `\n${content}`;
      }
      void ata(src);
    };
    const scheduleAta = () => {
      if (ataTimer) clearTimeout(ataTimer);
      ataTimer = setTimeout(runAta, 800);
    };

    const onChange = () => {
      const cur = getFileText(ydoc, "tsconfig.json")?.toJSON() ?? "";
      if (cur !== lastTsconfig) {
        lastTsconfig = cur;
        applyOptions(); // only when tsconfig.json actually changed
      }
      scheduleAta();
    };
    filesMap.observeDeep(onChange);
    scheduleAta();

    return () => {
      filesMap.unobserveDeep(onChange);
      if (ataTimer) clearTimeout(ataTimer);
    };
  }, [monaco, ydoc, enabled]);
}

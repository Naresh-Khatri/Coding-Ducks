"use client";

import { useEffect } from "react";
import type { Monaco } from "@monaco-editor/react";
import type * as Y from "yjs";

import { getFileText, getFilesMap } from "@acme/ducklet-fs";

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
 * compiler options derived from the project's `tsconfig.json`, re-applied
 * whenever that file changes.
 *
 * Dependency `.d.ts` are *not* acquired here. They're mirrored from the
 * WebContainer's real installed `node_modules` by `useNodeModulesTypes`, so the
 * editor resolves `react`, `next`, etc. against exactly what compiles.
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

    // Re-apply compiler options only when tsconfig.json actually changes —
    // never on every keystroke. Dependency types are handled separately by
    // useNodeModulesTypes (mirrored from the WebContainer's node_modules).
    const onChange = () => {
      const cur = getFileText(ydoc, "tsconfig.json")?.toJSON() ?? "";
      if (cur !== lastTsconfig) {
        lastTsconfig = cur;
        applyOptions(); // only when tsconfig.json actually changed
      }
    };
    filesMap.observeDeep(onChange);

    return () => {
      filesMap.unobserveDeep(onChange);
    };
  }, [monaco, ydoc, enabled]);
}

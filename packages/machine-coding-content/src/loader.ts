/**
 * Assembles `MachineCodingProblem`s from the on-disk problem tree. Each problem
 * is a folder under `./problems/<slug>/` holding real source files instead of
 * escaped template-literal strings, so starters/solutions/tests get syntax
 * highlighting, formatting, and clean diffs:
 *
 *   problems/<slug>/
 *     problem.ts        # the manifest — calls loadProblem({...})
 *     description.md     # problem statement
 *     editorial.md       # reference write-up (revealed with the solution)
 *     <variant>/         # one per variant: react | ts | js | vue | svelte
 *       starter/...      # files mirror their project-root path (e.g. src/App.tsx)
 *       solution/...
 *       test/...         # omit entirely to reuse the base variant's tests
 *
 * SERVER-SIDE ONLY: reads the filesystem, mirroring the package's existing
 * "server-only" contract (solutions/editorials never reach the client except
 * through the gated `machineCoding.getSolution` procedure).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  MachineCodingCategory,
  MachineCodingDifficulty,
  MachineCodingProblem,
  MachineCodingVariant,
} from "./types";

const PROBLEMS_DIR = join(dirname(fileURLToPath(import.meta.url)), "problems");

/** A non-base variant declared in a manifest; its files live in `<slug>/<dir>`. */
export interface VariantDef {
  id: string;
  label: string;
  templateId: string;
  /** Folder under the problem dir holding the variant's files. Defaults to id. */
  dir?: string;
}

/** Everything a `problem.ts` manifest supplies — metadata plus variant wiring. */
export interface ProblemDef {
  slug: string;
  title: string;
  difficulty: MachineCodingDifficulty;
  category: MachineCodingCategory;
  durationMinutes: number;
  tags: string[];
  companies: string[];
  displayOrder: number;
  /** Base template id (e.g. `react-ts`, `vanilla-ts`). */
  templateId: string;
  /**
   * Folder holding the base variant's files. Defaults to `react` for
   * `ui-component` problems and `ts` for everything else.
   */
  baseDir?: string;
  /** Additional variants — a JS toggle, or Vue/Svelte frameworks. */
  variants?: VariantDef[];
}

/** Read a directory tree into a `path → contents` map (keys relative to root). */
function readTree(root: string): Record<string, string> {
  const files: Record<string, string> = {};
  if (!existsSync(root)) return files;
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        // Normalise to forward slashes so seeded paths are stable across OSes.
        files[relative(root, full).split(sep).join("/")] = readFileSync(
          full,
          "utf8",
        );
      }
    }
  };
  walk(root);
  return files;
}

/** Read one variant folder's starter / solution / test buckets. */
function readVariant(
  problemDir: string,
  dir: string,
): {
  starter: Record<string, string>;
  solution: Record<string, string>;
  test: Record<string, string> | undefined;
} {
  const base = join(problemDir, dir);
  const test = readTree(join(base, "test"));
  return {
    starter: readTree(join(base, "starter")),
    solution: readTree(join(base, "solution")),
    // Omit when there's no `test/` folder so the variant reuses the base suite.
    test: Object.keys(test).length ? test : undefined,
  };
}

/** Default folder name for a problem's base variant. */
function defaultBaseDir(category: MachineCodingCategory): string {
  return category === "ui-component" ? "react" : "ts";
}

/**
 * Build a full `MachineCodingProblem` from a manifest by reading its co-located
 * source files off disk.
 */
export function loadProblem(def: ProblemDef): MachineCodingProblem {
  const problemDir = join(PROBLEMS_DIR, def.slug);
  const description = readFileSync(join(problemDir, "description.md"), "utf8");
  const editorial = readFileSync(join(problemDir, "editorial.md"), "utf8");

  const base = readVariant(
    problemDir,
    def.baseDir ?? defaultBaseDir(def.category),
  );

  const variants: MachineCodingVariant[] | undefined = def.variants?.map((v) => {
    const files = readVariant(problemDir, v.dir ?? v.id);
    return {
      id: v.id,
      label: v.label,
      templateId: v.templateId,
      starterFiles: files.starter,
      solutionFiles: files.solution,
      testFiles: files.test,
    };
  });

  return {
    slug: def.slug,
    title: def.title,
    difficulty: def.difficulty,
    category: def.category,
    durationMinutes: def.durationMinutes,
    tags: def.tags,
    companies: def.companies,
    templateId: def.templateId,
    displayOrder: def.displayOrder,
    description,
    editorial,
    starterFiles: base.starter,
    solutionFiles: base.solution,
    testFiles: base.test ?? {},
    ...(variants ? { variants } : {}),
  };
}

// Zero-dep resolve hook: lets Node's native TS type-stripping resolve the
// simulator's extensionless relative imports (./foo -> ./foo.ts).
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\//.test(specifier) && !/\.[mc]?[jt]s$/.test(specifier)) {
      try {
        const url = new URL(specifier + ".ts", context.parentURL);
        if (existsSync(fileURLToPath(url))) {
          return { url: url.href, shortCircuit: true };
        }
      } catch {}
    }
    return nextResolve(specifier, context);
  },
});

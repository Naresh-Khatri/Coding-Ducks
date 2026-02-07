---
name: Monorepo Guidelines
description: Turborepo conventions, package boundaries, and shared code patterns
---

# Monorepo Guidelines

You are working in a Turborepo monorepo. Follow these conventions for package organization and cross-package dependencies.

## Structure Overview

```
├── apps/                    # Deployable applications
│   ├── admin/               # Admin dashboard (Next.js)
│   ├── storefront/          # Customer-facing store (Next.js)
│   ├── storefront-api/      # Public API (Hono)
│   └── demo-storefront/     # Demo/testing app
├── packages/                # Shared libraries
│   ├── ui/                  # Shared UI components (shadcn-based)
│   ├── db/                  # Database schema & client (Drizzle)
│   ├── config/              # Shared configs (ESLint, TypeScript, Tailwind)
│   ├── storefront-sdk/      # SDK for storefront-api
│   └── utils/               # Shared utilities
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # Workspace definition
└── package.json             # Root package.json
```

## Package Types

### Apps (`apps/*`)
- **Purpose**: Deployable, runnable applications
- **Can import**: Any package from `packages/*`
- **Cannot be imported by**: Other packages or apps
- **Deploy independently**: Each app has its own deployment config

### Packages (`packages/*`)
- **Purpose**: Shared code consumed by apps or other packages
- **Can import**: Other packages (with dependency boundaries)
- **Can be imported by**: Apps and allowed packages

## Dependency Rules

### The Dependency Graph

```
apps/admin ──────┬──► packages/ui
                 ├──► packages/db
                 └──► packages/utils

apps/storefront ─┬──► packages/ui
                 ├──► packages/storefront-sdk
                 └──► packages/utils

packages/ui ─────┬──► packages/utils
                 └──► packages/config (devDep)

packages/db ─────┬──► packages/utils
                 └──► packages/config (devDep)

packages/storefront-sdk ──► packages/utils
```

### Rules

1. **Apps can import any package** but never each other
2. **Packages cannot import apps**
3. **Avoid circular dependencies** between packages
4. **`packages/config` is dev-only** — only extend, never runtime import
5. **`packages/db` is backend-only** — never import in frontend bundles

## Package Naming

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/button.tsx",
    "./card": "./src/card.tsx"
  }
}
```

- **Prefix**: `@repo/` for all internal packages
- **Version**: `0.0.0` for internal packages (not published)
- **Private**: Always `true` for internal packages
- **Exports**: Explicit entry points

## Package Configuration

### TypeScript Config

```json
// packages/ui/tsconfig.json
{
  "extends": "@repo/config/tsconfig.react.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### ESLint Config

```js
// packages/ui/eslint.config.js
import baseConfig from "@repo/config/eslint.react.js";

export default [...baseConfig];
```

### Tailwind Config (for UI packages)

```js
// packages/ui/tailwind.config.js
import sharedConfig from "@repo/config/tailwind.config.js";

export default {
  ...sharedConfig,
  content: ["./src/**/*.{ts,tsx}"],
};
```

## Creating a New Package

### 1. Create directory structure

```
packages/new-package/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Configure package.json

```json
{
  "name": "@repo/new-package",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "catalog:"
  }
}
```

### 3. Add to consuming apps

```json
// apps/admin/package.json
{
  "dependencies": {
    "@repo/new-package": "workspace:*"
  }
}
```

### 4. Run `pnpm install`

## Turborepo Configuration

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Key Concepts

- **`^` prefix**: Run in dependencies first (`^build` = build deps before self)
- **`dependsOn`**: Task dependencies
- **`outputs`**: Cached artifacts
- **`persistent`**: Long-running tasks (dev servers)

## Common Commands

```bash
# Run all apps in dev mode
pnpm dev

# Run specific app
pnpm dev --filter=admin

# Build everything
pnpm build

# Build specific package and its dependencies
pnpm build --filter=@repo/ui...

# Typecheck all
pnpm typecheck

# Add dependency to specific package
pnpm add zod --filter=@repo/storefront-sdk

# Add workspace dependency
pnpm add @repo/utils --filter=apps/admin --workspace
```

## Environment Variables

### Structure
- `.env.example` — Template, committed
- `.env.local` — Local overrides, gitignored
- `.env.production` — Production values (or use deployment platform)

### App-Specific
Each app can have its own env files:
```
apps/admin/.env.local
apps/storefront-api/.env.local
```

### Shared Secrets
Use a root `.env` for shared development secrets:
```
# Root .env
DATABASE_URL=postgres://...
```

Access via `turbo.json`:
```json
{
  "globalEnv": ["DATABASE_URL"]
}
```

## Build and Deploy

### Build Order
Turborepo automatically determines build order based on dependencies.

```bash
# Builds packages first, then apps
pnpm build
```

### Deploying Apps

Each app deploys independently:

```yaml
# apps/admin deployment
build:
  command: pnpm build --filter=admin
  output: apps/admin/.next

# apps/storefront-api deployment  
build:
  command: pnpm build --filter=storefront-api
  output: apps/storefront-api/dist
```

## Best Practices

### Do
✅ Keep packages focused and single-purpose  
✅ Use barrel exports (`index.ts`) for clean imports  
✅ Share types via dedicated `types.ts` exports  
✅ Document package purpose in README  
✅ Use `workspace:*` for internal dependencies  

### Don't
❌ Create circular dependencies  
❌ Import from `packages/db` in frontend apps  
❌ Put app-specific code in shared packages  
❌ Mix client and server code in same package  
❌ Forget to add `^` for dependent builds  

## Troubleshooting

### Common Issues

**"Module not found"**
- Run `pnpm install` after adding dependencies
- Check package exports in `package.json`
- Verify workspace reference: `"@repo/pkg": "workspace:*"`

**"Types not found"**
- Ensure `exports` includes `"types"` field
- Run `pnpm typecheck` from root

**Stale cache**
```bash
pnpm turbo clean
pnpm install
pnpm build
```

---

**Remember**: Monorepos trade setup complexity for development velocity. Keep package boundaries clean and dependencies one-directional.

/**
 * Seeding helpers for new ducklets: write a flat `{ path: content }` map into
 * the doc, and a StackBlitz-style catalogue of starter templates for the
 * create flow. Each template is a self-contained project that boots in the
 * WebContainer via its `startCommand`.
 */
import * as Y from "yjs";

import { getFilesMap, writeFile } from "./model";

/** Write many files at once in a single transaction (used to seed a doc). */
export function seedFiles(doc: Y.Doc, files: Record<string, string>): void {
  doc.transact(() => {
    for (const [path, content] of Object.entries(files)) {
      writeFile(doc, path, content);
    }
  });
}

/** True when the doc has no files yet (safe to seed a template into). */
export function isEmptyProject(doc: Y.Doc): boolean {
  return getFilesMap(doc).size === 0;
}

export interface DuckletTemplate {
  id: string;
  label: string;
  description: string;
  /** Command WebContainer runs to start the dev server. */
  startCommand: string;
  /** Port the dev server is expected to listen on. */
  port: number;
  /** Whether the project needs `npm install` before the start command. */
  install: boolean;
  files: Record<string, string>;
}

function pkg(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2) + "\n";
}

const STATIC_TEMPLATE: DuckletTemplate = {
  id: "static",
  label: "Static",
  description: "Plain HTML, CSS & JS served as-is. The classic ducklet.",
  startCommand: "npx --yes serve -l 3000 .",
  port: 3000,
  install: false,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      scripts: { start: "npx --yes serve -l 3000 ." },
    }),
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <h1>Hello World</h1>
      <p>Start coding!</p>
    </div>
    <script src="script.js"></script>
  </body>
</html>
`,
    "style.css": `.container {
  padding: 2rem;
  font-family: sans-serif;
}
h1 {
  color: #3b82f6;
}
`,
    "script.js": `console.log("Hello from your new Ducklet!");
`,
  },
};

const VANILLA_TEMPLATE: DuckletTemplate = {
  id: "vanilla",
  label: "Vanilla",
  description: "Vite + vanilla JavaScript with hot reload.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      devDependencies: { vite: "^6.0.0" },
    }),
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`,
    "src/main.js": `import "./style.css";

document.querySelector("#app").innerHTML = \`
  <h1>Hello Vite 🦆</h1>
  <p>Edit <code>src/main.js</code> and save to reload.</p>
\`;
`,
    "src/style.css": `body {
  font-family: sans-serif;
  padding: 2rem;
}
h1 {
  color: #646cff;
}
`,
  },
};

const VANILLA_TS_TEMPLATE: DuckletTemplate = {
  id: "vanilla-ts",
  label: "TypeScript",
  description: "Vite + vanilla TypeScript with hot reload.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      devDependencies: { typescript: "^5.7.0", vite: "^6.0.0" },
    }),
    "tsconfig.json": pkg({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        skipLibCheck: true,
      },
      include: ["src"],
    }),
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    "src/main.ts": `import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = \`
  <h1>Hello Vite + TS 🦆</h1>
  <p>Edit <code>src/main.ts</code> and save to reload.</p>
\`;
`,
    "src/style.css": `body {
  font-family: sans-serif;
  padding: 2rem;
}
h1 {
  color: #3178c6;
}
`,
  },
};

const REACT_TEMPLATE: DuckletTemplate = {
  id: "react",
  label: "React",
  description: "Vite + React with Fast Refresh.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      devDependencies: { "@vitejs/plugin-react": "^4.3.4", vite: "^6.0.0" },
    }),
    "vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    "src/main.jsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    "src/App.jsx": `export default function App() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Hello from React 🦆</h1>
      <p>Edit src/App.jsx and watch it reload.</p>
    </main>
  );
}
`,
  },
};

const REACT_TS_TEMPLATE: DuckletTemplate = {
  id: "react-ts",
  label: "React + TS",
  description: "Vite + React + TypeScript with Fast Refresh.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.4",
        typescript: "^5.7.0",
        vite: "^6.0.0",
      },
    }),
    "tsconfig.json": pkg({
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
      },
      include: ["src"],
    }),
    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    "src/App.tsx": `export default function App() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Hello from React + TS 🦆</h1>
      <p>Edit src/App.tsx and watch it reload.</p>
    </main>
  );
}
`,
  },
};

const VUE_TEMPLATE: DuckletTemplate = {
  id: "vue",
  label: "Vue",
  description: "Vite + Vue 3 single-file components.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      dependencies: { vue: "^3.5.0" },
      devDependencies: { "@vitejs/plugin-vue": "^5.2.0", vite: "^6.0.0" },
    }),
    "vite.config.js": `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({ plugins: [vue()] });
`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`,
    "src/main.js": `import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
`,
    "src/App.vue": `<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <main style="font-family: sans-serif; padding: 2rem">
    <h1>Hello from Vue 🦆</h1>
    <button @click="count++">count is {{ count }}</button>
  </main>
</template>
`,
  },
};

const SVELTE_TEMPLATE: DuckletTemplate = {
  id: "svelte",
  label: "Svelte",
  description: "Vite + Svelte components.",
  startCommand: "npm run dev",
  port: 5173,
  install: true,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { dev: "vite --host", build: "vite build" },
      devDependencies: {
        "@sveltejs/vite-plugin-svelte": "^5.0.0",
        svelte: "^5.0.0",
        vite: "^6.0.0",
      },
    }),
    "vite.config.js": `import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({ plugins: [svelte()] });
`,
    "svelte.config.js": `import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default { preprocess: vitePreprocess() };
`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ducklet</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`,
    "src/main.js": `import { mount } from "svelte";
import App from "./App.svelte";

const app = mount(App, { target: document.getElementById("app") });

export default app;
`,
    "src/App.svelte": `<script>
  let count = $state(0);
</script>

<main style="font-family: sans-serif; padding: 2rem">
  <h1>Hello from Svelte 🦆</h1>
  <button onclick={() => count++}>count is {count}</button>
</main>
`,
  },
};

const NODE_TEMPLATE: DuckletTemplate = {
  id: "node",
  label: "Node.js",
  description: "A minimal Node HTTP server. Good for backend experiments.",
  startCommand: "node server.js",
  port: 3000,
  install: false,
  files: {
    "package.json": pkg({
      name: "ducklet",
      private: true,
      type: "module",
      scripts: { start: "node server.js" },
    }),
    "server.js": `import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end("<h1>Hello from Node in your browser 🦆</h1>");
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
`,
  },
};

export const TEMPLATES: DuckletTemplate[] = [
  STATIC_TEMPLATE,
  VANILLA_TEMPLATE,
  VANILLA_TS_TEMPLATE,
  REACT_TEMPLATE,
  REACT_TS_TEMPLATE,
  VUE_TEMPLATE,
  SVELTE_TEMPLATE,
  NODE_TEMPLATE,
];

export const DEFAULT_TEMPLATE_ID = REACT_TEMPLATE.id;

export function getTemplate(id: string): DuckletTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

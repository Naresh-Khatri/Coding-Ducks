import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Data Table

Build a sortable, paginated table over a fixed dataset.

## Requirements

- Render the rows in a \`<table>\` with **Name** and **Age** column headers.
- Clicking a column header sorts by that column **ascending**; clicking the same header again toggles to **descending**.
- Paginate the (sorted) rows **2 per page** with **Prev** / **Next** buttons and a \`role="status"\` reading \`Page X of Y\`.
- Changing the sort returns to the first page.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Keep the source rows constant and **derive** what's shown: sort a copy by the
active column/direction, then slice the current page out of the sorted list.
Sorting and paging are independent transforms layered over the same data.

\`\`\`tsx
const sorted = useMemo(() => {
  if (!sort) return ROWS;
  return [...ROWS].sort((a, b) => {
    const x = a[sort.key];
    const y = b[sort.key];
    const cmp =
      typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y));
    return sort.dir === "asc" ? cmp : -cmp;
  });
}, [sort]);
\`\`\`

Always sort a **copy** — \`Array.prototype.sort\` mutates in place, and sorting the
source array would corrupt the original order.
`;

export const dataTable: MachineCodingProblem = {
  slug: "data-table",
  title: "Data Table",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 40,
  tags: ["React", "Sorting", "Pagination"],
  companies: ["Amazon", "Microsoft", "Atlassian"],
  templateId: "react-ts",
  displayOrder: 150,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useMemo, useState } from "react";

interface Row {
  name: string;
  age: number;
}

const ROWS: Row[] = [
  { name: "Carol", age: 30 },
  { name: "Alice", age: 25 },
  { name: "Dave", age: 22 },
  { name: "Bob", age: 28 },
  { name: "Erin", age: 35 },
];

const PAGE_SIZE = 2;

export default function App() {
  // TODO:
  //  - click a header to sort by that column (toggle asc/desc on repeat clicks)
  //  - paginate the sorted rows PAGE_SIZE per page with Prev/Next
  //  - a role="status" shows "Page X of Y"; changing sort resets to page 1
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.slice(0, PAGE_SIZE).map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useMemo, useState } from "react";

interface Row {
  name: string;
  age: number;
}

const ROWS: Row[] = [
  { name: "Carol", age: 30 },
  { name: "Alice", age: 25 },
  { name: "Dave", age: 22 },
  { name: "Bob", age: 28 },
  { name: "Erin", age: 35 },
];

const PAGE_SIZE = 2;
type SortKey = keyof Row;
interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

export default function App() {
  const [sort, setSort] = useState<Sort | null>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return ROWS;
    return [...ROWS].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const cmp =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const sortBy = (key: SortKey) => {
    setPage(0);
    setSort((s) =>
      s && s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            <th>
              <button type="button" onClick={() => sortBy("name")}>
                Name
              </button>
            </th>
            <th>
              <button type="button" onClick={() => sortBy("age")}>
                Age
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
      >
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          Prev
        </button>
        <span role="status">
          {"Page " + (currentPage + 1) + " of " + pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage >= pageCount - 1}
        >
          Next
        </button>
      </div>
    </main>
  );
}
`,
  },
  testFiles: {
    "src/App.test.tsx": `import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

// Body row names, in display order (skip the header row).
const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent ?? "");
const status = () => screen.getByRole("status").textContent ?? "";
const header = (name: string) => screen.getByRole("button", { name });
const nextPage = () => screen.getByRole("button", { name: "Next" });

cases("Data Table", [
  {
    name: "shows the first page of rows",
    input: "render the table",
    expected: { names: ["Carol", "Alice"], status: "Page 1 of 3" },
    run: () => {
      render(<App />);
      return { names: names(), status: status() };
    },
  },
  {
    name: "Next moves to the following page",
    input: "click Next",
    expected: { names: ["Dave", "Bob"], status: "Page 2 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(nextPage());
      return { names: names(), status: status() };
    },
  },
  {
    name: "sorts by name ascending",
    input: "click the Name header",
    expected: ["Alice", "Bob"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(header("Name"));
      return names();
    },
  },
  {
    name: "toggles to descending on a second click",
    input: "click the Name header twice",
    expected: ["Erin", "Dave"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(header("Name"));
      await user.click(header("Name"));
      return names();
    },
  },
  {
    name: "sorts by age",
    input: "click the Age header",
    expected: ["Dave", "Alice"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(header("Age"));
      return names();
    },
  },
]);
`,
  },
};

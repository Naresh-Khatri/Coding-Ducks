import { useMemo, useState } from "react";

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

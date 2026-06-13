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

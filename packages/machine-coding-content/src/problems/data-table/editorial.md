# Solution

Keep the source rows constant and **derive** what's shown: sort a copy by the
active column/direction, then slice the current page out of the sorted list.
Sorting and paging are independent transforms layered over the same data.

```tsx
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
```

Always sort a **copy** — `Array.prototype.sort` mutates in place, and sorting the
source array would corrupt the original order.

# Data Table

Build a sortable, paginated table over a fixed dataset.

## Requirements

- Render the rows in a `<table>` with **Name** and **Age** column headers.
- Clicking a column header sorts by that column **ascending**; clicking the same header again toggles to **descending**.
- Paginate the (sorted) rows **2 per page** with **Prev** / **Next** buttons and a `role="status"` reading `Page X of Y`.
- Changing the sort returns to the first page.

Implement it in `src/App.tsx`.

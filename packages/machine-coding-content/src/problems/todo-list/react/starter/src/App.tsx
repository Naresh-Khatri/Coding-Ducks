import { useState } from "react";

export default function App() {
  // TODO:
  //  - track the list of todos and the input text in state
  //  - "Add" (or Enter) appends the trimmed text; ignore empty input
  //  - each item has a "Delete" button that removes only that item
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Todo List</h1>
      <form>
        <input aria-label="New todo" placeholder="Add a todo" />
        <button type="submit">Add</button>
      </form>
      <ul></ul>
    </main>
  );
}

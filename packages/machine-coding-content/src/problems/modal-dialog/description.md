# Modal Dialog

Build an accessible modal dialog.

## Requirements

- An **Open** button shows the dialog; it is **not** in the document until opened.
- The dialog has `role="dialog"` and `aria-modal="true"`.
- The dialog closes when: the **Close** button is clicked, **Escape** is pressed, or the **backdrop** (the area outside the dialog) is clicked.
- Clicking **inside** the dialog does not close it.

Implement it in `src/App.tsx`.

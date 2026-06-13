# Solution

Model comments as a tree of `{ id, text, children }`. A small recursive component
renders one node and its children. Adding a reply is an immutable update that
walks the tree and rebuilds only the branch leading to the target parent.

```tsx
function addReply(nodes: Comment[], parentId: string, text: string): Comment[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, makeComment(text)] }
      : { ...n, children: addReply(n.children, parentId, text) },
  );
}
```

Because each node keeps its own "is the reply box open?" state locally, opening
one reply box doesn't disturb any of the others.

import { deepClone } from "./deep-clone";

const original = { a: 1, nested: { b: [2, 3] } };
const copy = deepClone(original);
copy.nested.b.push(4);

const app = document.querySelector("#app");
app.innerHTML =
  "<h1>Deep Clone</h1>" +
  "<p>original: <code>" + JSON.stringify(original) + "</code></p>" +
  "<p>copy: <code>" + JSON.stringify(copy) + "</code></p>";

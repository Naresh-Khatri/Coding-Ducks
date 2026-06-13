import { flatten } from "./flatten";

const app = document.querySelector<HTMLDivElement>("#app")!;
const input = [1, [2, [3, [4]], 5]];
app.innerHTML = `
  <h1>Flatten Array</h1>
  <p>input: <code>${JSON.stringify(input)}</code></p>
  <p>output: <code>${JSON.stringify(flatten(input))}</code></p>
  <p>Run the tests from the Problem panel.</p>
`;

import { promisePool } from "./promise-pool";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = "<h1>Promise Pool</h1><p>Running…</p>";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const tasks = [1, 2, 3, 4, 5].map((n) => async () => {
  await wait(100 * n);
  return n * n;
});

promisePool(tasks, 2).then((results) => {
  app.innerHTML =
    "<h1>Promise Pool</h1>" +
    "<p>squares (limit 2): <code>" + JSON.stringify(results) + "</code></p>";
});

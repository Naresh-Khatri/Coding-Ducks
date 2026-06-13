import { curry } from "./curry";

const sum = (a: number, b: number, c: number) => a + b + c;
const add = curry(sum) as (a: number) => (b: number) => (c: number) => number;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  "<h1>Curry</h1>" +
  "<p>const add = curry((a, b, c) => a + b + c)</p>" +
  "<p>add(1)(2)(3) = " + add(1)(2)(3) + "</p>";

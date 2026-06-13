import { curry } from "./curry";

const sum = (a, b, c) => a + b + c;
const add = curry(sum);

const app = document.querySelector("#app");
app.innerHTML =
  "<h1>Curry</h1>" +
  "<p>const add = curry((a, b, c) => a + b + c)</p>" +
  "<p>add(1)(2)(3) = " + add(1)(2)(3) + "</p>";

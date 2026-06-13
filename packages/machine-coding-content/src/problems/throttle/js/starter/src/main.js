import { throttle } from "./throttle";

const app = document.querySelector("#app");
app.innerHTML =
  "<h1>Throttle</h1>" +
  '<button id="tick">click me fast</button>' +
  '<p id="out">handled 0×</p>';

const out = document.querySelector("#out");
let handled = 0;
const onClick = throttle(() => {
  out.textContent = "handled " + ++handled + "×";
}, 500);
document
  .querySelector("#tick")
  .addEventListener("click", onClick);

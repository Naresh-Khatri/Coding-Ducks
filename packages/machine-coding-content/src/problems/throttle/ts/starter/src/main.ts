import { throttle } from "./throttle";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  "<h1>Throttle</h1>" +
  '<button id="tick">click me fast</button>' +
  '<p id="out">handled 0×</p>';

const out = document.querySelector<HTMLParagraphElement>("#out")!;
let handled = 0;
const onClick = throttle(() => {
  out.textContent = "handled " + ++handled + "×";
}, 500);
document
  .querySelector<HTMLButtonElement>("#tick")!
  .addEventListener("click", onClick);

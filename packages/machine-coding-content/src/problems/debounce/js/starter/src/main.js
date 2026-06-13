import "./style.css";

import { debounce } from "./debounce";

const app = document.querySelector("#app");
app.innerHTML = `
  <h1>Debounce</h1>
  <input id="box" placeholder="type fast…" />
  <p id="out">fired 0×</p>
`;

const out = document.querySelector("#out");
let calls = 0;
const onType = debounce(() => {
  out.textContent = `fired ${++calls}×`;
}, 400);
document.querySelector("#box").addEventListener("input", onType);

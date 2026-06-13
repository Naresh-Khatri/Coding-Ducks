import { EventEmitter } from "./event-emitter";

const log = [];
const bus = new EventEmitter();
bus.on("greet", (name) => log.push("hello " + String(name)));
bus.once("greet", () => log.push("(this listener fires once)"));
bus.emit("greet", "world");
bus.emit("greet", "again");

const app = document.querySelector("#app");
app.innerHTML = "<h1>Event Emitter</h1><pre>" + log.join("\n") + "</pre>";

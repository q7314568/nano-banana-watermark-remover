import { createApp } from "vue";
import "./styles.css";
import App from "./App.vue";

console.log("main.ts executing...");

const app = createApp(App);
app.mount("#app");
console.log("Vue app mounted.");

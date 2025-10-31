import { podcasts, genres, seasons } from "./data.js";
import { initApp } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  initApp({ podcasts, genres, seasons });
});

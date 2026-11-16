import { createRoot } from "react-dom/client";
import { isNativeApp } from "./lib/platform";
import App from "./App.tsx";
import "./index.css";
import "./cinema.css";

createRoot(document.getElementById("root")!).render(<App />);

if (!isNativeApp() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

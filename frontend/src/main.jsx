import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Apply saved theme immediately before first paint
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") document.documentElement.classList.add("dark");
else document.documentElement.classList.remove("dark");

// Dùng HashRouter để app chạy được khi đóng gói thành phần mềm desktop
// (Electron load index.html qua giao thức file://, BrowserRouter sẽ không khớp).
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

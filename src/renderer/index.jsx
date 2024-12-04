import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import { Application } from "./components/Application";
import { AppProvider } from "../context/AppContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
// In the renderer process
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "c") {
    document.execCommand("copy");
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "v") {
    document.execCommand("paste");
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    event.preventDefault();
    document.execCommand("selectAll"); // Select all text
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "z") {
    event.preventDefault();
    document.execCommand("undo"); // Undo the last action
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "y") {
    // Optional: Ctrl+Y for Redo
    event.preventDefault();
    document.execCommand("redo"); // Redo the last undone action
  }
});

console.log("window.env.DEBUG->", window.env.DEBUG);

root.render(
  <AppProvider>
    <Application />
  </AppProvider>
);

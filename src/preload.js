// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge } = require("electron");

let domContentLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  domContentLoaded = true;
});

function dispatchNotification(eventType, message) {
  window.dispatchEvent(new CustomEvent(eventType, { detail: message }));
}

contextBridge.exposeInMainWorld("savedXApi", {
  logIntoX: () => ipcRenderer.send("log-into-x"),
});

ipcRenderer.on("NOTIFICATION", (event, message) => {
  console.log("message from main:", message);
  if (domContentLoaded) dispatchNotification("NOTIFICATION", message);
  else {
    console.log("Dom content not loaded yet!");
    setTimeout(() => {
      dispatchNotification("NOTIFICATION", message);
    }, 1500);
  }
});

ipcRenderer.on("CONTENT", async (event, message) => {
  console.log("content message from main!");
  console.log(message);
  if (domContentLoaded) dispatchNotification("CONTENT", message);
  while (!domContentLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  dispatchNotification("CONTENT", message);
});

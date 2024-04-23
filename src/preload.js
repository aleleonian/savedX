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
  goFetchTweets: () => ipcRenderer.send("go-fetch-tweets"),
  getDataFromBackend: () => ipcRenderer.send("read-tweets-from-db"),
});

ipcRenderer.on("NOTIFICATION", (event, message) => {
  console.log("message from main:", message);
  if (domContentLoaded) dispatchNotification("NOTIFICATION", message);
  else {
    setTimeout(() => {
      dispatchNotification("NOTIFICATION", message);
    }, 1500);
  }
});

ipcRenderer.on("CONTENT", async (event, message) => {
  if (domContentLoaded) dispatchNotification("CONTENT", message);
  while (!domContentLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  dispatchNotification("CONTENT", message);
});

ipcRenderer.on("SHOW_PROGRESS", async (event, message) => {
  console.log("preload.js->SHOW_PROGRESS:", message);
  dispatchNotification("SHOW_PROGRESS", message);
});
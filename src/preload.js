// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge, shell } = require("electron");

let domContentLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  domContentLoaded = true;
});

function dispatchNotification(eventType, message) {
  window.dispatchEvent(new CustomEvent(eventType, { detail: message }));
}

// console.log("shell->", shell);

contextBridge.exposeInMainWorld("savedXApi", {
  goFetchTweets: () => ipcRenderer.send("go-fetch-tweets"),
  stopScraping: () => ipcRenderer.send("stop-scraping"),
  getDataFromBackend: () => ipcRenderer.send("read-tweets-from-db"),
  openUrl: (url) => {
    shell.openExternal(url)
  },
  updateTagsForTweet: (tweetId, newTags) => ipcRenderer.send("update-tags-for-tweet", tweetId, newTags),
  removeTagFromDB: (tag) => ipcRenderer.send('remove-tag-from-db', tag)
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

ipcRenderer.on("DISABLE_GO_FETCH_BUTTON", () => {
  console.log("DISABLE_GO_FETCH_BUTTON message from main:");
  if (domContentLoaded) dispatchNotification("DISABLE_GO_FETCH_BUTTON");
  else {
    setTimeout(() => {
      dispatchNotification("DISABLE_GO_FETCH_BUTTON");
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
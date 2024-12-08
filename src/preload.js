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

/// Single object to expose all APIs
const api = {
  goFetchTweets: () => ipcRenderer.send("go-fetch-tweets"),
  stopScraping: () => ipcRenderer.send("stop-scraping"),
  getDataFromBackend: () => ipcRenderer.send("read-tweets-from-db"),
  openUrl: (url) => shell.openExternal(url),
  updateTagsForTweet: (tweetId, newTags) => ipcRenderer.send("update-tags-for-tweet", tweetId, newTags),
  removeTagFromDB: (tag) => ipcRenderer.send("remove-tag-from-db", tag),
  getConfigData: () => ipcRenderer.send("fetch-config-data"),
  updateConfigData: (formData) => ipcRenderer.send("update-config-data", formData),
  DEBUG: process.env.DEBUG,
  openDebugSession: () => ipcRenderer.send("open-debug-session"),
  deleteSavedTweet: (tweetId) => ipcRenderer.invoke("delete-saved-tweet", tweetId),
  deleteAllSavedTweets: () => ipcRenderer.invoke("delete-all-saved-tweets"),
};

let debugValueSet = false;

ipcRenderer.on('env-debug', (event, debugValue) => {
  api.DEBUG = debugValue;
  debugValueSet = true;
  // Only expose API once the DEBUG value is set
  if (debugValueSet) {
    contextBridge.exposeInMainWorld('savedXApi', api);
  }
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
  if (domContentLoaded) dispatchNotification("DISABLE_GO_FETCH_BUTTON");
  else {
    setTimeout(() => {
      dispatchNotification("DISABLE_GO_FETCH_BUTTON");
    }, 1500);
  }
});

ipcRenderer.on("CONTENT", async (event, message) => {
  console.log("CONTENT preload: ", message);
  if (domContentLoaded) dispatchNotification("CONTENT", message);
  while (!domContentLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  dispatchNotification("CONTENT", message);
});

ipcRenderer.on("SHOW_PROGRESS", async (event, message) => {
  dispatchNotification("SHOW_PROGRESS", message);
});

ipcRenderer.on("ALERT", async (event, message) => {
  dispatchNotification("ALERT", message);
});

ipcRenderer.on("SHOW_CONFIG_DIALOG", (event, configData) => {
  console.log("SHOW_CONFIG_DIALOG preload configData:", configData);
  if (domContentLoaded) dispatchNotification("SHOW_CONFIG_DIALOG", configData);
  else {
    setTimeout(() => {
      dispatchNotification("SHOW_CONFIG_DIALOG", configData);
    }, 1500);
  }
});
ipcRenderer.on("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG", (event) => {
  console.log("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG preload");
  dispatchNotification("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG");
});

ipcRenderer.on("CONFIG_DATA", (event, message) => {
  if (domContentLoaded) dispatchNotification("CONFIG_DATA", message);
  else {
    setTimeout(() => {
      dispatchNotification("CONFIG_DATA", message);
    }, 1500);
  }
});

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge, shell } from "electron";
import * as common from "./util/common.mjs";

let domContentLoaded = false;
const eventQueue = [];

// ✅ Create a Promise that resolves when DOM is ready
const waitForDOM = new Promise((resolve) => {
  if (document.readyState === "complete") {
    domContentLoaded = true;
    resolve();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      domContentLoaded = true;
      resolve();
      console.log("✅ DOMContentLoaded event fired");
      // Process queued events
      eventQueue.forEach(({ type, message }) => dispatchNotification(type, message));
      eventQueue.length = 0; // Clear queue
    });
  }
});

console.log("✅ preload.mjs loaded and registering ipcRenderer event listeners...");

function dispatchNotification(eventType, message) {
  window.dispatchEvent(new CustomEvent(eventType, { detail: message }));
}

// ✅ Queue events if DOM isn't ready yet
function safeDispatch(eventType, message) {
  if (domContentLoaded) {
    dispatchNotification(eventType, message);
  } else {
    eventQueue.push({ type: eventType, message });
  }
}

/// Single object to expose all APIs
const api = {
  goFetchTweets: () => ipcRenderer.invoke("go-fetch-tweets"),
  stopScraping: () => ipcRenderer.send("stop-scraping"),
  getDataFromBackend: () => ipcRenderer.send("read-tweets-from-db"),
  openUrl: (url) => shell.openExternal(url),
  updateTagsForTweet: (tweetId, newTags) =>
    ipcRenderer.invoke("update-tags-for-tweet", tweetId, newTags),
  removeTagFromDB: (tag) => ipcRenderer.invoke("remove-tag-from-db", tag),
  getConfigData: () => ipcRenderer.invoke("fetch-config-data"),
  updateConfigData: (formData) =>
    ipcRenderer.invoke("update-config-data", formData),
  openDebugSession: () => ipcRenderer.send("open-debug-session"),
  deleteSavedTweet: async (tweetData) => ipcRenderer.invoke("delete-saved-tweet", tweetData),
  deleteAllSavedTweets: async () => ipcRenderer.invoke("delete-all-saved-tweets"),
  reportFoundTweet: (reportObj) => {
    common.debugLog(api.DEBUG, "reportFoundTweet() reportObj:", JSON.stringify(reportObj));
    ipcRenderer.send("report-found-tweet", reportObj);
  },
};

// ✅ DEBUG: Log all IPC events sent to preload.mjs
const originalOn = ipcRenderer.on;
ipcRenderer.on = (channel, listener) => {
  console.log(`📩 Listening to IPC event: ${channel}`);
  return originalOn.call(ipcRenderer, channel, (...args) => {
    console.log(`📨 IPC Event Received: ${channel}`, args);
    listener(...args);
  });
};


// ✅ Expose API once `env-vars` are set
let envVarsValuesSet = false;
ipcRenderer.on("env-vars", (event, envVarsValues) => {
  api.DEBUG = envVarsValues["DEBUG"];
  api.MEDIA_FOLDER = envVarsValues["MEDIA_FOLDER"];
  envVarsValuesSet = true;

  if (envVarsValuesSet) {
    contextBridge.exposeInMainWorld("savedXApi", api);
  }
});

// ✅ Simplified event handlers using `safeDispatch()`
ipcRenderer.on("NOTIFICATION", (event, message) => {
  common.debugLog(api.DEBUG, "message from main:", message);
  safeDispatch("NOTIFICATION", message);
});

ipcRenderer.on("DISABLE_GO_FETCH_BUTTON", () => {
  safeDispatch("DISABLE_GO_FETCH_BUTTON");
});

ipcRenderer.on("CONTENT", async (event, message) => {
  console.log("📨 CONTENT event received in preload.mjs");
  await waitForDOM; // ⏳ Wait for DOM to be ready before dispatching
  dispatchNotification("CONTENT", message);
});

ipcRenderer.on("WAIT_FOR_USER_ACTION", async (event, message) => {
  common.debugLog("📨 WAIT_FOR_USER_ACTION event received in preload.mjs. Message: " + message);
  dispatchNotification("WAIT_FOR_USER_ACTION", message);
});

ipcRenderer.on("SHOW_PROGRESS", (event, message) => {
  safeDispatch("SHOW_PROGRESS", message);
});

ipcRenderer.on("ALERT", (event, message) => {
  safeDispatch("ALERT", message);
});

ipcRenderer.on("SHOW_CONFIG_DIALOG", (event, configData) => {
  safeDispatch("SHOW_CONFIG_DIALOG", configData);
});

ipcRenderer.on("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG", () => {
  common.debugLog(api.DEBUG, "SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG preload");
  safeDispatch("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG");
});

ipcRenderer.on("CONFIG_DATA", (event, message) => {
  safeDispatch("CONFIG_DATA", message);
});

ipcRenderer.on("CHECK_SAVED_TWEET_EXISTS", (event, tweetUrl) => {
  safeDispatch("CHECK_SAVED_TWEET_EXISTS", tweetUrl);
});

// ✅ Handle SNAPSHOT_TAKEN event properly
ipcRenderer.on("SNAPSHOT_TAKEN", () => {
  safeDispatch("SNAPSHOT_TAKEN");
});

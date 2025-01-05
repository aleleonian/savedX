// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge, shell } = require("electron");
import * as common from "./renderer/util/common";

let domContentLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  domContentLoaded = true;
});

function dispatchNotification(eventType, message) {
  window.dispatchEvent(new CustomEvent(eventType, { detail: message }));
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
  // DEBUG: Boolean(process.env.DEBUG),
  openDebugSession: () => ipcRenderer.send("open-debug-session"),
  deleteSavedTweet: async (tweetData) => {
    return ipcRenderer.invoke("delete-saved-tweet", tweetData);
  },
  deleteAllSavedTweets: async () => {
    const deleteAllTweetsResult = await ipcRenderer.invoke(
      "delete-all-saved-tweets"
    );
    return deleteAllTweetsResult;
  },
  reportFoundTweet: (reportObj) => {
    common.debugLog(
      api.DEBUG,
      "reportFoundTweet() reportObj:",
      JSON.stringify(reportObj)
    );
    ipcRenderer.send("report-found-tweet", reportObj);
  },
};

let envVarsValuesSet = false;

ipcRenderer.on("env-vars", (event, envVarsValues) => {
  api.DEBUG = envVarsValues["DEBUG"];
  api.MEDIA_FOLDER = envVarsValues["MEDIA_FOLDER"];
  envVarsValuesSet = true;
  // Only expose API once the DEBUG value is set
  if (envVarsValuesSet) {
    contextBridge.exposeInMainWorld("savedXApi", api);
  }
});

ipcRenderer.on("NOTIFICATION", (event, message) => {
  common.debugLog(api.DEBUG, "message from main:", message);
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
  common.debugLog(api.DEBUG, "CONTENT at preload: ", JSON.stringify(message));
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
  common.debugLog(
    api.DEBUG,
    "SHOW_CONFIG_DIALOG preload configData:",
    JSON.stringify(configData)
  );
  if (domContentLoaded) dispatchNotification("SHOW_CONFIG_DIALOG", configData);
  else {
    setTimeout(() => {
      dispatchNotification("SHOW_CONFIG_DIALOG", configData);
    }, 1500);
  }
});
ipcRenderer.on("SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG", () => {
  common.debugLog(api.DEBUG, "SHOW_DELETE_ALL_SAVED_TWEETS_DIALOG preload");
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

ipcRenderer.on("CHECK_SAVED_TWEET_EXISTS", (event, tweetUrl) => {
  dispatchNotification("CHECK_SAVED_TWEET_EXISTS", tweetUrl);
});

//TODO: this is ON HOLD
ipcRenderer.on("SNAPSHOT_TAKEN", () => {
  dispatchNotification("SNAPSHOT_TAKEN");
});

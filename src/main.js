const appName = "savedX";
const path = require("path");
const APP_FOLDER = path.join(process.env.HOME, appName);
const envPath = path.resolve(APP_FOLDER, ".env");
const dotenv = require("dotenv");
const result = dotenv.config({ path: envPath });
process.env.APP_FOLDER = APP_FOLDER;

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const fs = require("fs");

/////// log stuff /////////

const log = require("electron-log");
log.transports.console.level = "debug";
log.transports.file.level = "debug";

const logFilePath = path.join(APP_FOLDER, "my-log-file.log");
log.transports.file.resolvePathFn = () => logFilePath;

if (!fs.existsSync(process.env.APP_FOLDER)) {
  fs.mkdirSync(process.env.APP_FOLDER, { recursive: true });
}

process.env.MEDIA_FOLDER = path.join(process.env.APP_FOLDER, "Media");

import { startExpressServer } from "./webserver";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import {
  checkUserAndPass,
  updateConfigData,
  getAllConfigData,
} from "./util/account";
import { menuTemplate } from "./data/menu-template";
import { XBot } from "./classes/XBot";

import {
  goFetchTweets,
  goFetchTweetsFake,
  stopScraping,
} from "./goFetchTweets";

import { sendMessageToMainWindow, setMainWindow } from "./util/messaging";

import { mainEmitter } from "./util/event-emitter.js";

if (result.error) {
  common.debugLog("Failed to load .env file:", result.error);
} else {
  common.debugLog(
    "Loaded environment variables:",
    JSON.stringify(result.parsed)
  );
}
common.debugLog("envPath->", envPath);
common.debugLog("process.env.MEDIA_FOLDER->", process.env.MEDIA_FOLDER);
common.debugLog("result:", JSON.stringify(result));
common.debugLog("process.env.APP_FOLDER ->", process.env.APP_FOLDER);

let mainWindow;
let xBot;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      allowFileAccessFromFileURLs: true,
    },
  });

  // Build and set the menu
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  setMainWindow(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    const debugEnvVar = (() => {
      try {
        const value = process.env.DEBUG ? JSON.parse(process.env.DEBUG) : false;
        return value;
      } catch (error) {
        common.debugLog("Error occurred:", error);
        return false;
      }
    })();

    const mediaFolderEnvVar = (() => {
      try {
        const value = process.env.MEDIA_FOLDER
          ? process.env.MEDIA_FOLDER
          : "UNDEFINED";
        return value;
      } catch (error) {
        common.debugLog("Error occurred:", error);
        return false;
      }
    })();

    const envVarsValues = {};
    envVarsValues["DEBUG"] = debugEnvVar;
    envVarsValues["MEDIA_FOLDER"] = mediaFolderEnvVar;
    sendMessageToMainWindow("env-vars", envVarsValues);
  });

  // and load the index.html of the app.
  if (process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const viteName = process.env.MAIN_WINDOW_VITE_NAME || "main_window";
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${viteName}/index.html`)
    );
  }
  common.debugLog("MAIN_WINDOW_VITE_NAME->", MAIN_WINDOW_VITE_NAME);
  mainWindow.webContents.openDevTools({ mode: "detach" });
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  xBot = new XBot();

  createWindow();
  const initStatus = await init();
  if (!initStatus.success) {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--${initStatus.errorMessage}`
    );
  }

  const allConfigDataResponse = await getAllConfigData();
  common.debugLog(
    "allConfigDataResponse->",
    JSON.stringify(allConfigDataResponse)
  );
  if (allConfigDataResponse.success) {
    xBot.downloadMedia = allConfigDataResponse.data.DOWNLOAD_MEDIA;
    xBot.deleteOnlineBookmarks =
      allConfigDataResponse.data.DELETE_ONLINE_BOOKMARKS;
  } else {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--${allConfigDataResponse.errorMessage}`
    );
  }

  startExpressServer(xBot);
});

// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// app.on("ready", () => {
//   if (process.env.DEBUG) {
//     startExpressServer(xBot); // Start the Express server here
//   }
// });

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  // Your code to run before the app process exits
  dbTools.closeDb();
  // Save data, perform cleanup, etc.
});

ipcMain.handle("fetch-config-data", async () => {
  try {
    const getAllConfigDataResponse = await getAllConfigData();
    return getAllConfigDataResponse;
  } catch (error) {
    return common.createErrorResponse(error);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle("go-fetch-tweets", async () => {
  const checkUserAndPassResponse = await checkUserAndPass();
  const failedResponseObject = {
    title: "Bro...",
    message: "An unknown error occurred 😕",
  };

  if (checkUserAndPassResponse.success) {
    const allConfigDataResponse = await getAllConfigData();
    if (allConfigDataResponse.success) {
      await goFetchTweets(xBot, allConfigDataResponse.data);
      return common.createSuccessResponse();
    } else {
      failedResponseObject.errorMessage = `There's some error with the db 😫 : ${allConfigDataResponse.errorMessage}`;
    }
  } else {
    failedResponseObject.errorMessage = `There's no user and pass 😫`;
  }
  return common.createErrorResponse(failedResponseObject.message);
});

ipcMain.on("stop-scraping", () => {
  common.debugLog("we gonna stop scraping then.");
  stopScraping();
});

ipcMain.handle("update-tags-for-tweet", async (event, tweetId, newTags) => {
  const updateTagsResult = await dbTools.updateTags(tweetId, newTags);
  common.debugLog("updateTagsResult->", updateTagsResult);
  return updateTagsResult;
});

ipcMain.handle("remove-tag-from-db", async (event, tag) => {
  try {
    const removeTagFromDBResult = await dbTools.removeTagFromDB(tag);
    common.debugLog("removeTagFromDBResult->", removeTagFromDBResult);
    return removeTagFromDBResult;
  } catch (error) {
    return common.createErrorResponse(error);
  }
});

ipcMain.handle("delete-saved-tweet", async (event, tweetData) => {
  return new Promise((resolve) => {
    (async () => {
      try {
        const deleteTweetResult = await dbTools.deleteTweetById(tweetData.id);
        if (deleteTweetResult) {
          // delete media if necessary
          if (tweetData.hasLocalMedia !== "no") {
            let filePath =
              process.env.MEDIA_FOLDER + "/" + tweetData.tweetUrlHash;
            if (tweetData.hasLocalMedia === "image") {
              filePath += ".jpg";
            } else if (tweetData.hasLocalMedia === "video") {
              filePath += ".mp4";
            }
            const fileDeletionResult = await common.deleteFile(filePath);
            if (fileDeletionResult) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
          resolve(true);
        } else {
          resolve(false);
          sendMessageToMainWindow(
            "NOTIFICATION",
            "error--Tweet was not deleted"
          );
        }
      } catch (error) {
        resolve(false);
        sendMessageToMainWindow(
          "NOTIFICATION",
          "error--Tweet was not deleted: " + error
        );
      }
    })();
  });
});
ipcMain.handle("delete-all-saved-tweets", async () => {
  return new Promise((resolve) => {
    (async () => {
      try {
        const deleteAllTweestResult = await dbTools.deleteAllTweets();
        if (deleteAllTweestResult.success) {
          if (xBot.downloadMedia) {
            const deleteMediaFilesResult =
              await common.deleteAllFilesInDirectory(process.env.MEDIA_FOLDER);
            if (deleteMediaFilesResult.success) {
              resolve(true);
            } else {
              sendMessageToMainWindow(
                "NOTIFICATION",
                "error--Tweets were deleted but not all files in the media folder"
              );
              // If we resolve false, then the local saved tweets array won't be updated
              resolve(true);
            }
          } else resolve(true);
          // sendMessageToMainWindow("NOTIFICATION", "success--Tweets were deleted!");
        } else {
          resolve(false);
          // sendMessageToMainWindow("NOTIFICATION", "error--Tweets were NOT deleted");
        }
      } catch (error) {
        resolve(false);
        sendMessageToMainWindow(
          "NOTIFICATION",
          "error--Tweet was not deleted: " + error
        );
      }
    })();
  });
});

ipcMain.on("report-found-tweet", async (event, reportObj) => {
  common.debugLog("report-found-tweet reportObj->", JSON.stringify(reportObj));
  mainEmitter.emit("report-found-tweet", reportObj);
});

ipcMain.on("update-config-data", async (event, formData) => {
  try {
    const updateConfigDataResponse = await updateConfigData(formData);
    if (updateConfigDataResponse.success) {
      sendMessageToMainWindow("NOTIFICATION", `success--Config data updated!`);
    } else {
      sendMessageToMainWindow(
        "ALERT",
        `Trouble updating config data mai fren:  ${JSON.stringify(
          updateConfigDataResponse.errorMessage
        )}`
      );
    }
  } catch (error) {
    sendMessageToMainWindow("ALERT", {
      title: "Something happened...",
      message: `Trouble updating config data: ${error}`,
    });
  }
});
ipcMain.on("open-debug-session", async () => {
  try {
    common.debugLog("open-debug-session!");

    if (true) {
      sendMessageToMainWindow("NOTIFICATION", `success--open-debug-session!`);
    }
    // else {
    //   sendMessageToMainWindow(
    //     "ALERT",
    //     `Trouble updating config data mai fren:  ${JSON.stringify(
    //       updateConfigDataResponse.errorMessage
    //     )}`
    //   );
    // }
  } catch (error) {
    sendMessageToMainWindow("ALERT", {
      title: "Ouch...",
      message: `Trouble updating config data: ${error}`,
    });
  }
});

common.debugLog(
  "DEBUG in main process:",
  process.env.DEBUG ? JSON.parse(process.env.DEBUG) : false
);

const init = async () => {
  common.debugLog("process.env.NODE_ENV->", process.env.NODE_ENV);
  const dbPath = path.join(process.env.APP_FOLDER, "savedx.db");

  common.debugLog("dbPath>", dbPath);

  const openDbResult = await dbTools.openDb(dbPath);

  if (openDbResult) {
    const tweets = await dbTools.readAllTweets();
    const readAllTagsResult = await dbTools.readAllTags();

    let resultOBj = {};
    resultOBj.success = true;

    if (!tweets.success) {
      resultOBj.success = tweets.success;
      if (tweets.errorMessage) resultOBj.errorMessage = tweets.errorMessage;
    }

    if (!readAllTagsResult.success) {
      resultOBj.success = readAllTagsResult.success;
      if (tweets.errorMessage) {
        if (resultOBj.errorMessage) {
          resultOBj.errorMessage += "\n" + readAllTagsResult.errorMessage;
        } else resultOBj.errorMessage = readAllTagsResult.errorMessage;
      }
    }

    if (!resultOBj.success) return resultOBj;

    sendMessageToMainWindow("CONTENT", {
      tweets: tweets.rows,
      tags: readAllTagsResult.rows,
    });
    return resultOBj;
  } else {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--There were issues opening / creating the db file 😫`
    );
    sendMessageToMainWindow("DISABLE_GO_FETCH_BUTTON");
  }
};

require("dotenv").config();
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("node:path");
import { startExpressServer } from "./webserver";
import * as dbTools from "./util/db";
import * as common from "./util/common";
import {
  checkUserAndPass,
  updateConfigData,
  getAllConfigData,
  changeDownloadMediaConfig,
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
        const value = JSON.parse(process.env.DEBUG);
        return value;
      } catch (error) {
        console.error("Error occurred:", error);
        return false;
      }
    })();

    sendMessageToMainWindow("env-debug", debugEnvVar || false);
  });

  // and load the index.html of the app.
  if (process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${process.env.MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }

  // mainWindow.webContents.openDevTools({ mode: "detach" });
  mainWindow.webContents.openDevTools();
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

  if (process.env.DEBUG) {
    startExpressServer(xBot); // Start the Express server here
  }
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("go-fetch-tweets", async () => {
  const checkUserAndPassResponse = await checkUserAndPass();
  const failedResponseObject = {
    title: "Bro...",
    message: "An unknown error occurred 😕",
  };

  if (checkUserAndPassResponse.success) {
    const allConfigDataResponse = await getAllConfigData();
    if (allConfigDataResponse.success) {
      await goFetchTweets(xBot, allConfigDataResponse.data);
      return;
    } else {
      failedResponseObject.message = `There's some error with the db 😫 : ${allConfigDataResponse.errorMessage}`;
    }
  } else {
    failedResponseObject.message = `There's no user and pass 😫`;
  }
  sendMessageToMainWindow("SHOW_CONFIG_DIALOG");
  sendMessageToMainWindow("ALERT", failedResponseObject);
  return;
});

ipcMain.on("stop-scraping", async () => {
  // const credentials = await dbTools.getXCredentials();
  // await goFetchTweetsFake();
  common.debugLog(process.env.DEBUG, "we gonna stop scraping then.");
  await stopScraping();
});

ipcMain.on("update-tags-for-tweet", async (event, tweetId, newTags) => {
  const updateTagsResult = await dbTools.updateTags(tweetId, newTags);

  //TODO TENGO QUE COMUNICAR A REACT SI FUE BIEN
  //O MAL EL UPDATE
  common.debugLog(process.env.DEBUG, "updateTagsResult->", updateTagsResult);
});

ipcMain.on("remove-tag-from-db", async (event, tag) => {
  const removeTagFromDBResult = await dbTools.removeTagFromDB(tag);
  //TODO TENGO QUE COMUNICAR A REACT SI FUE BIEN
  //O MAL EL UPDATE
  if (!removeTagFromDBResult.success) {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--${removeTagFromDBResult.errorMessage} 😫`
    );
  }
  common.debugLog(
    process.env.DEBUG,
    "removeTagFromDBResult->",
    removeTagFromDBResult
  );
});

ipcMain.on("fetch-config-data", async () => {
  const getAllConfigDataResponse = await getAllConfigData();
  sendMessageToMainWindow("CONFIG_DATA", getAllConfigDataResponse);
});

ipcMain.handle("delete-saved-tweet", async (event, tweetData) => {
  return new Promise((resolve) => {
    (async () => {
      try {
        const deleteTweetResult = await dbTools.deleteTweetById(tweetData.id);
        if (deleteTweetResult) {
          // delete media if necessary
          if (tweetData.hasLocalMedia !== "no") {
            let filePath = "media/" + tweetData.tweetUrlHash;
            if (tweetData.hasLocalMedia === "image") {
              filePath += ".jpg";
            } else if (tweetData.hasLocalMedia === "video") {
              filePath += ".mp4";
            }
            const fileDeletionResult = await common.deleteFile(filePath);
            if (fileDeletionResult) {
              resolve(true);
              sendMessageToMainWindow(
                "NOTIFICATION",
                "success--Tweet was deleted!"
              );
            } else {
              resolve(false);
              sendMessageToMainWindow(
                "NOTIFICATION",
                "error--Tweet was deleted from db but not the media file!"
              );
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
        if (deleteAllTweestResult) {
          if (common.deleteAllFilesInDirectory("./media")) {
            resolve(true);
          } else {
            sendMessageToMainWindow(
              "NOTIFICATION",
              "error--Tweets were deleted but not all files in the media folder"
            );
            resolve(false);
          }
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
  common.debugLog(
    process.env.DEBUG,
    "report-found-tweet reportObj->",
    JSON.stringify(reportObj)
  );
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
    common.debugLog(process.env.DEBUG, "open-debug-session!");

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

console.log("DEBUG in main process:", JSON.parse(process.env.DEBUG));

const init = async () => {
  let dbPath;
  common.debugLog(
    process.env.DEBUG,
    "process.env.NODE_ENV->",
    process.env.NODE_ENV
  );
  dbPath =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "debug"
      ? path.resolve(app.getAppPath(), "src", "data", "savedx.db")
      : "./savedx.db";

  common.debugLog(process.env.DEBUG, "dbPath>", dbPath);

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

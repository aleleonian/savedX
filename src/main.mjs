const appName = "savedX";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { XBOTConstants } from "xbot-js";

process.on('uncaughtException', (err) => {
  console.error('[savedX] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[savedX] Unhandled Promise Rejection:', reason);
});


// 👇 Convert ESM URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const homeDir = os.homedir();

if (!homeDir) {
  console.error("homeDir error: no exists!");
  process.abort();
}

const APP_FOLDER = path.join(homeDir, appName);

if (!APP_FOLDER) {
  console.error("APP_FOLDER error: does not exist!");
  process.abort();
}

const envPath = path.resolve(APP_FOLDER, ".env");
if (!envPath) {
  console.error("envPath error: does not exist!");
  process.abort();
}

//TODO: make this warnings alerts so they can be seen graphically or smth

import dotenv from "dotenv";

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("env file error:", result.error);
} else common.debugLog(`.env file loaded from ${envPath}`);

process.env.APP_FOLDER = APP_FOLDER;

import { app, BrowserWindow, ipcMain, Menu } from "electron";
import fs from "node:fs";

/////// log stuff /////////

import log from "electron-log";
log.transports.console.level = "debug";
log.transports.file.level = "debug";

const logFilePath = path.join(APP_FOLDER, "my-log-file.log");

log.transports.file.resolvePathFn = () => logFilePath;

if (!fs.existsSync(process.env.APP_FOLDER)) {
  fs.mkdirSync(process.env.APP_FOLDER, { recursive: true });
}

process.env.MEDIA_FOLDER = path.join(process.env.APP_FOLDER, "Media");

if (!fs.existsSync(process.env.MEDIA_FOLDER)) {
  fs.mkdirSync(process.env.MEDIA_FOLDER, { recursive: true });
}

import { startExpressServer, stopExpressServer } from "./webserver.mjs";
import * as dbTools from "./util/db.mjs";
import * as common from "./util/common.mjs";
import {
  checkUserAndPass,
  updateConfigData,
  getAllConfigData,
} from "./util/account.mjs";
import { menuTemplate } from "./data/menu-template.mjs";
import { XBot } from "xbot-js";

import {
  goFetchTweets,
  goFetchTweetsFake,
  stopScraping,
} from "./goFetchTweets.mjs";

import { sendMessageToMainWindow, setMainWindow } from "./util/messaging.mjs";

import { mainEmitter } from "./util/event-emitter.mjs";

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
common.debugLog("process.env.APP_FOLDER ->", process.env.APP_FOLDER);
common.debugLog(
  "main.mjs: process.env.XBOT_HEADLESS->",
  process.env.XBOT_HEADLESS
);


let xBot, mainWindow, contentForApp;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from "electron-squirrel-startup";
if (electronSquirrelStartup) {
  app.quit();
}

const rootPath = process.env.NODE_ENV === "development"
  ? process.cwd()  // Use the real project root in dev mode
  : app.getAppPath();  // Use app path in production

common.debugLog("📌 process.cwd() ->", process.cwd());
common.debugLog("📌 app.getAppPath() ->", app.getAppPath());
common.debugLog("📌 __dirname ->", __dirname);
common.debugLog("📌 preloadPath before setting ->", path.join(rootPath, "src", "preload.mjs"));

const preloadPath = path.join(rootPath, "src", "preload.mjs");

common.debugLog("preloadPath->", preloadPath);

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
      allowFileAccessFromFileURLs: true,
      devTools: true,
    },
  });

  // Build and set the menu
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  setMainWindow(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
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

    common.debugLog("✅ Renderer finished loading. Sending CONTENT event...");
    sendMessageToMainWindow("CONTENT", contentForApp);
  });

  // and load the index.html of the app.

  common.debugLog("Running from:", __dirname);
  common.debugLog("Resolved path:", path.join(__dirname, "../dist/index.html"));

  //TODO: voy por aquí, como hago bien lo de appUrl
  const isDev = process.env.NODE_ENV === "development";
  common.debugLog("isDev->" + isDev);
  const viteName = process.env.MAIN_WINDOW_VITE_NAME || ""; // Ensure this matches the correct folder
  const appUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  common.debugLog(`Loading URL: ${appUrl}`);
  mainWindow.loadURL(appUrl);


  // if (process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  //   mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL);
  // } else {
  //   const viteName = process.env.MAIN_WINDOW_VITE_NAME || "main_window";
  //   mainWindow.loadFile(
  //     path.join(__dirname, `../renderer/${viteName}/index.html`)
  //   );
  // }
  mainWindow.webContents.openDevTools({ mode: "detach" });
};

const waitForVite = async (port = 5173, timeout = 10000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok) return true;
    } catch (e) { }
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(async () => {

  if (process.env.NODE_ENV === "development") {
    common.debugLog("Waiting for Vite dev server...");
    const viteReady = await waitForVite(5173, 5000);
    if (!viteReady) {
      console.error("Vite dev server is not running! Exiting.");
      app.quit();
      return;
    }
  }

  xBot = new XBot();

  xBot.on(XBOTConstants.XBotEvents.NOTIFICATION, (data) => {
    common.debugLog(`✅ XBOTConstants.XBotEvents.NOTIFICATION: ${data}`);
    sendMessageToMainWindow(
      "NOTIFICATION",
      data
    );
  });
  xBot.on(XBOTConstants.XBotEvents.WAIT_FOR_USER_ACTION, (data) => {
    common.debugLog(`✅ XBOTConstants.XBotEvents.WAIT_FOR_USER_ACTION: ${data}`);
    sendMessageToMainWindow(
      "WAIT_FOR_USER_ACTION",
      data
    );
  });

  xBot.on(XBOTConstants.XBotEvents.LOG, (level, ...messages) => {
    const logMessage = `[${level.toUpperCase()}] ${messages.join(" ")}`;

    if (level === XBOTConstants.LOG_LEVELS.ERROR) {
      common.errorLog(logMessage);
    } else if (level === XBOTConstants.LOG_LEVELS.DEBUG) {
      common.debugLog(logMessage);
    } else if (level === XBOTConstants.LOG_LEVELS.WARN) {
      common.warnLog(logMessage);
    } else {
      common.infoLog(logMessage);
    }

    // Send logs to frontend (UI log panel)
    sendMessageToMainWindow("LOG_MESSAGE", logMessage);
  });


  xBot.on("dummy-notify", (data) => {
    common.debugLog(`✅ dummy-notify: ${data}`);
  });

  xBot.emit("dummy-notify", "test message from savedX");

  xBot.on(XBOTConstants.XBotEvents.CHECK_SAVED_TWEET_EXISTS, (data) => {
    log.info(`✅ CHECK_SAVED_TWEET_EXISTS: ${data}`);
    sendMessageToMainWindow(
      "CHECK_SAVED_TWEET_EXISTS",
      data
    );
  });

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

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", async () => {
  // Save data, perform cleanup, etc.
  dbTools.closeDb();
  await stopExpressServer();
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
      try {
        await goFetchTweets(xBot, allConfigDataResponse.data);
        return common.createSuccessResponse();
      } catch (error) {
        return common.createErrorResponse(error);
      }
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
  try {
    const deleteTweetResult = await dbTools.deleteTweetById(tweetData.id);
    if (deleteTweetResult) {
      // delete media if necessary
      if (tweetData.hasLocalMedia !== "no") {
        let filePath = process.env.MEDIA_FOLDER + "/" + tweetData.tweetUrlHash;
        if (tweetData.hasLocalMedia === "image") {
          filePath += ".jpg";
        } else if (tweetData.hasLocalMedia === "video") {
          filePath += ".mp4";
        }
        const fileDeletionResult = await common.deleteFile(filePath);
        if (fileDeletionResult) {
          return common.createSuccessResponse();
        } else {
          return common.createSuccessResponse(
            "The tweet was deleted but the associated file was not."
          );
        }
      }
      return common.createSuccessResponse();
    } else {
      return common.createErrorResponse("Tweet was not deleted");
    }
  } catch (error) {
    return common.createErrorResponse("Tweet was not deleted: " + error);
  }
});
ipcMain.handle("delete-all-saved-tweets", async () => {
  try {
    const deleteAllTweestResult = await dbTools.deleteAllTweets();
    if (deleteAllTweestResult.success) {
      if (xBot.downloadMedia) {
        const deleteMediaFilesResult = await common.deleteAllFilesInDirectory(
          process.env.MEDIA_FOLDER
        );
        if (deleteMediaFilesResult.success) {
          return common.createSuccessResponse();
        } else {
          // If we resolve false, then the local saved tweets array won't be updated
          return common.createSuccessResponse(
            "Tweets were deleted but not all files in the media folder"
          );
        }
      } else return common.createSuccessResponse();
    } else {
      return common.createErrorResponse(deleteAllTweestResult.errorMessage);
    }
  } catch (error) {
    return common.createErrorResponse("Tweet was not deleted: " + error);
  }
});

ipcMain.on("report-found-tweet", async (event, reportObj) => {
  common.debugLog("report-found-tweet reportObj->", JSON.stringify(reportObj));
  mainEmitter.emit("report-found-tweet", reportObj);
});

ipcMain.handle("xbot-continue", async (event) => {
  try {
    console.log("we're at xbot-continue");
    xBot.emit(XBOTConstants.XBotEvents.CONTINUE);
  } catch (error) {
    return common.createErrorResponse(`Trouble with xbot-continue: ${error}`);
  }
});

ipcMain.handle("update-config-data", async (event, formData) => {
  try {
    const updateConfigDataResponse = await updateConfigData(formData);
    if (updateConfigDataResponse.success) {
      return common.createSuccessResponse();
    } else {
      return common.createErrorResponse(updateConfigDataResponse.errorMessage);
    }
  } catch (error) {
    return common.createErrorResponse(`Trouble updating config data: ${error}`);
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
    common.debugLog("open-debug-session error:", error);
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
    common.debugLog("📨 Sending CONTENT event to renderer:");
    // sendMessageToMainWindow("CONTENT", { tweets: tweets.rows, tags: readAllTagsResult.rows });
    contentForApp = { tweets: tweets.rows, tags: readAllTagsResult.rows };
    return resultOBj;
  } else {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--There were issues opening / creating the db file 😫`
    );
    sendMessageToMainWindow("DISABLE_GO_FETCH_BUTTON");
  }
};
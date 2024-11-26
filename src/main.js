require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
import * as dbTools from "./util/db";
import { checkUserAndPass, updateConfigData } from "./util/account";

import {
  goFetchTweets,
  goFetchTweetsFake,
  stopScraping,
} from "./goFetchTweets";
import { sendMessageToMainWindow, setMainWindow } from "./util/messaging";

let mainWindow;
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
      nodeIntegration: false, // Node.js features disabled
      contextIsolation: true,
      sandbox: false,
    },
  });

  setMainWindow(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools console
  mainWindow.webContents.openDevTools({ mode: "detach" });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  const initStatus = await init();
  if (!initStatus.success) {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--${initStatus.errorMessage}`
    );
  }
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

app.on("before-quit", () => {
  // Your code to run before the app process exits
  dbTools.closeDb();
  // Save data, perform cleanup, etc.
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("go-fetch-tweets", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  // await goFetchTweetsFake();
  const checkUserAndPassResponse = await checkUserAndPass();
  if (checkUserAndPassResponse.success) {
    const data = checkUserAndPassResponse.data;
    await goFetchTweets(
      data.TWITTER_BOT_USERNAME,
      data.TWITTER_BOT_PASSWORD,
      data.TWITTER_BOT_EMAIL
    );
  } else {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--Bro, there's no user and pass 😫`
    );
    sendMessageToMainWindow("SHOW_CONFIG_DIALOG");
  }
});

ipcMain.on("stop-scraping", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  // await goFetchTweetsFake();
  console.log("we gonna stop scraping then.");
  await stopScraping();
});

ipcMain.on("update-tags-for-tweet", async (event, tweetId, newTags) => {
  const updateTagsResult = await dbTools.updateTags(tweetId, newTags);

  //TODO TENGO QUE COMUNICAR A REACT SI FUE BIEN
  //O MAL EL UPDATE
  console.log("updateTagsResult->", updateTagsResult);
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
  console.log("removeTagFromDBResult->", removeTagFromDBResult);
});

ipcMain.on("fetch-config-data", async () => {
  // try {
  //   const result = await dbTools.getQuery(query, params); // A DB helper function
  //   return result; // This will be sent to the renderer
  // } catch (err) {
  //   throw new Error('Error fetching data from DB');
  // }
  console.log("fetch-config-data from main.js");
  const checkUserAndPassResponse = await checkUserAndPass();
  console.log(
    "checkUserAndPassResponse->",
    JSON.stringify(checkUserAndPassResponse)
  );
  sendMessageToMainWindow("CONFIG_DATA", checkUserAndPassResponse);
});

// updateConfigData: (formData)=> ipcRenderer.send('update-config-data', formData)

ipcMain.on("update-config-data", async (event, formData) => {
  try {
    const updateConfigDataResponse = await updateConfigData(formData);
    if (updateConfigDataResponse.success) {
      sendMessageToMainWindow("NOTIFICATION", `success--Config data updated!`);
    } else {
      sendMessageToMainWindow(
        "NOTIFICATION",
        `error--Trouble updating config data: ${updateConfigDataResponse.errorMessage}`
      );
    }
  } catch (error) {
    sendMessageToMainWindow(
      "NOTIFICATION",
      `error--Trouble updating config data: ${updateConfigDataResponse.errorMessage}`
    );
  }
});

const init = async () => {
  let dbPath;
  console.log("process.env.NODE_ENV->", process.env.NODE_ENV);
  dbPath =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "debug"
      ? path.resolve(app.getAppPath(), "src", "data", "savedx.db")
      : "./savedx.db";

  console.log("dbPath>", dbPath);

  const openDbResult = await dbTools.openDb(dbPath);
  // VOY POR ACÁ, ESTE openDbResult da false
  console.log("openDbResult->", openDbResult);

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

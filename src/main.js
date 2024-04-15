require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
import fs from "fs";
import * as dbTools from "./util/db";
import { XBot } from "./classes/XBot";

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
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow();
  const initStatus = await init();
  if (!initStatus.success) {
    mainWindow.webContents.send(
      "NOTIFICATION",
      `error--${initStatus.errorMessage}`
    );
  }
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Your code to run before the app process exits
  dbTools.closeDb();
  // Save data, perform cleanup, etc.
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("log-into-x", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  const xBot = new XBot();
  let result = await xBot.init();
  if (result.success) {
    result = await xBot.loginToX();
    if (result.success) {
      await xBot.wait(8000);
      await xBot.goto("https://twitter.com/i/bookmarks");
      await xBot.wait(8000);
      const bookmarks = await xBot.scrapeBookmarks();
      // const filePath = "bookmarks.json";
      // // Convert the array to a string
      // const arrayJson = JSON.stringify(bookmarks, null, 2);

      // // Write the array contents to a file
      // fs.writeFile(filePath, arrayJson, (err) => {
      //   if (err) {
      //     console.error("Error writing file:", err);
      //   } else {
      //     console.log(
      //       "Array contents have been successfully dumped into the file:",
      //       filePath
      //     );
      //   }
      // });
      await dbTools.storeTweets(bookmarks);
      await xBot.logOut();
    }
    await xBot.closeBrowser();
    const tweets = await dbTools.readAllTweets();
    mainWindow.webContents.send("CONTENT", tweets.rows);
  }
});
ipcMain.on("log-into-x", async (event, data) => {
  // const credentials = await dbTools.getXCredentials();
  const xBot = new XBot();
  let result = await xBot.init();
  if (result.success) {
    result = await xBot.loginToX();
    if (result.success) {
      await xBot.wait(8000);
      await xBot.goto("https://twitter.com/i/bookmarks");
      await xBot.wait(8000);
      const bookmarks = await xBot.scrapeBookmarks();
      // const filePath = "bookmarks.json";
      // // Convert the array to a string
      // const arrayJson = JSON.stringify(bookmarks, null, 2);

      // // Write the array contents to a file
      // fs.writeFile(filePath, arrayJson, (err) => {
      //   if (err) {
      //     console.error("Error writing file:", err);
      //   } else {
      //     console.log(
      //       "Array contents have been successfully dumped into the file:",
      //       filePath
      //     );
      //   }
      // });
      await dbTools.storeTweets(bookmarks);
      await xBot.logOut();
    }
    await xBot.closeBrowser();
    const tweets = await dbTools.readAllTweets();
    mainWindow.webContents.send("CONTENT", tweets.rows);
  }
});
ipcMain.on("read-tweets-from-db", async (event, data) => {
  const tweets = await dbTools.readAllTweets();
  mainWindow.webContents.send("SAVED_TWEETS", tweets.rows);
});

const init = async () => {
  // Check if the file exists
  let dbPath;
  dbPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(app.getAppPath(), "src", "data", "savedx.db")
      : "./savedx.db";
  const openDbResult = await dbTools.openDb(dbPath);
  if (openDbResult) {
    const tweets = await dbTools.readAllTweets();
    if (!tweets.success) {
      const resultOBj = {};
      resultOBj.success = tweets.success;
      if (tweets.errorMessage) resultOBj.errorMessage = tweets.errorMessage
      return resultOBj;
    }
    else {
      mainWindow.webContents.send("CONTENT", tweets.rows);
      return { success: true };
    }
  }
}

